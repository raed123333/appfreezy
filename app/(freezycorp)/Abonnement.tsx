import { Link, router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from '../context/AuthContext';
import PDFService from '../services/PDFService';
import { API } from "@/config";

const { width, height } = Dimensions.get("window");

// Define the Subscription interface matching OurOffers
interface Subscription {
  id: number;
  subscriptionId: string;
  status: string;
  isActive: boolean;
  nextBillingDate: string;
  offreId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Define the Payment interface
interface Payment {
  idpay: number;
  userId: number;
  userName: string;
  userLastName: string;
  compagnyName: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
  status: string;
  description: string;
  offreId: number | null;
  utilisateurId: number;
  dateDebut: string;
  dateFin: string;
  createdAt: string;
  updatedAt: string;
}

const Abonnement = () => {
  const { user, logout } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: null as (() => void) | null,
    onCancel: null as (() => void) | null 
  });

  // Function to show custom alert
  const showCustomAlertMessage = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
    setAlertConfig({
      title,
      message,
      onConfirm: onConfirm || null,
      onCancel: onCancel || null
    });
    setShowCustomAlert(true);
  };

  const handleCustomAlertClose = () => {
    setShowCustomAlert(false);
  };

  const handleCustomAlertConfirm = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setShowCustomAlert(false);
  };

  const handleCustomAlertCancel = () => {
    if (alertConfig.onCancel) {
      alertConfig.onCancel();
    }
    setShowCustomAlert(false);
  };

  const getAuthToken = (): string | null => {
    if (!user) return null;
    
    if (user.token) return user.token;
    if (user.utilisateur && user.utilisateur.token) return user.utilisateur.token;
    if (user.accessToken) return user.accessToken;
    
    return null;
  };

  // Fetch active subscription - using same logic as OurOffers
  const fetchActiveSubscription = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        setActiveSubscription(null);
        return;
      }

      const response = await fetch(`${API}/payment/active-subscriptions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const subscriptions = await response.json();
        
        if (Array.isArray(subscriptions) && subscriptions.length > 0) {
          // Get the latest active subscription with correct status - same logic as OurOffers
          const latestActiveSubscription = subscriptions.find((sub: Subscription) => 
            sub.isActive === true && 
            ['succeeded', 'active', 'paid'].includes(sub.status)
          ) || subscriptions[0];
          
          setActiveSubscription(latestActiveSubscription);
        } else {
          setActiveSubscription(null);
        }
      } else {
        setActiveSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      setActiveSubscription(null);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API}/payment/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const payments: Payment[] = await response.json();
        
        if (!Array.isArray(payments)) {
          console.error("Invalid response format:", payments);
          setPaymentHistory([]);
          return;
        }
        
        const succeededPayments = payments.filter(payment => 
          payment.status === 'succeeded' || payment.status === 'completed'
        );
        
        setPaymentHistory(succeededPayments);
      } else {
        setPaymentHistory([]);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      setPaymentHistory([]);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchUserSubscriptionData();
  }, [user]);

  // Rechargement quand la page redevient active
  useFocusEffect(
    useCallback(() => {
      fetchUserSubscriptionData();
    }, [user])
  );

  const fetchUserSubscriptionData = async (): Promise<void> => {
    try {
      setLoading(true);
      await Promise.all([
        fetchActiveSubscription(),
        fetchPaymentHistory()
      ]);
    } catch (error) {
      console.error("Error fetching user subscription data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchUserSubscriptionData();
  };

  const handleDownloadPDF = async (payment: Payment): Promise<void> => {
    try {
      setDownloadingId(payment.idpay);
      await PDFService.downloadAndSharePDF(payment);
    } catch (error) {
      console.error('Download error:', error);
      showCustomAlertMessage(
        "Erreur",
        "Impossible de télécharger le PDF"
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const getOffreName = (offreId: number | null): string => {
    const offreNames: { [key: number]: string } = {
      1: "Mensuelle",
      3: "Trimestrielle", 
      6: "Semestrielle",
      12: "Annuelle"
    };
    return offreId ? (offreNames[offreId] || "Mensuelle") : "Mensuelle";
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Date non disponible";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      return "Date invalide";
    }
  };

  const getNextBillingDate = (): string => {
    if (!activeSubscription || !activeSubscription.nextBillingDate) {
      return "Non disponible";
    }
    
    try {
      const nextDate = new Date(activeSubscription.nextBillingDate);
      if (isNaN(nextDate.getTime())) return "Date invalide";
      
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return nextDate.toLocaleDateString('fr-FR', options);
    } catch (error) {
      return "Date invalide";
    }
  };

  // Cancel subscription function - using same logic as OurOffers
  const handleCancelSubscription = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      
      if (!activeSubscription || !activeSubscription.subscriptionId) {
        showCustomAlertMessage("Erreur", "Aucun abonnement actif trouvé");
        return;
      }

      console.log("Cancelling subscription:", activeSubscription.subscriptionId);

      const response = await fetch(`${API}/payment/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscriptionId: activeSubscription.subscriptionId
        })
      });

      if (response.status === 200) {
        showCustomAlertMessage(
          "Abonnement annulé",
          "Votre abonnement a été annulé avec succès. Aucun paiement futur ne sera effectué.",
          () => {
            // Refresh the data after cancellation
            fetchUserSubscriptionData();
          }
        );
      } else {
        const errorData = await response.json();
        showCustomAlertMessage("Erreur", errorData.error || "Erreur lors de l'annulation de l'abonnement");
      }
    } catch (err) {
      console.error("Cancel subscription error:", err);
      showCustomAlertMessage("Erreur", "Erreur de connexion lors de l'annulation");
    }
  };

  const handleLogout = async (): Promise<void> => {
    showCustomAlertMessage(
      "Déconnexion", 
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      async () => {
        try {
          await logout();
        } catch (error) {
          console.error('Error during logout:', error);
        }
      }
    );
  };

  // Check if subscription is active
  const isSubscriptionActive = (): boolean => {
    return activeSubscription !== null && 
           activeSubscription.isActive && 
           ['succeeded', 'active', 'paid'].includes(activeSubscription.status);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#04D9E7" />
        <Text style={styles.loadingText}>Chargement des données d'abonnement...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCustomAlertClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customAlert}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>
                {alertConfig.message}
              </Text>
            </View>
            <View style={styles.alertFooter}>
              {alertConfig.onCancel && (
                <TouchableOpacity 
                  style={[styles.alertButton, styles.alertButtonSecondary]}
                  onPress={handleCustomAlertCancel}
                >
                  <Text style={[styles.alertButtonText, styles.alertButtonTextSecondary]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={alertConfig.onConfirm ? handleCustomAlertConfirm : handleCustomAlertClose}
              >
                <Text style={styles.alertButtonText}>
                  {alertConfig.onConfirm ? "Confirmer" : "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed top container */}
      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.specialbuttonRow}>
            {/* Back button with logout functionality */}
            <TouchableOpacity onPress={handleLogout}>
              <Image
                source={require("../../assets/images/iconBack.png")}                          
                style={styles.icon}
              />
            </TouchableOpacity>
            <Link href="./Menu" asChild>
              <TouchableOpacity>
                <Image
                  source={require("../../assets/images/iconHome.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </Link>
          </View>
        </ImageBackground>
      </View>

      {/* Scrollable content with pull-to-refresh */}
      <ScrollView 
        contentContainerStyle={{ paddingTop: height * 0.1 + 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#04D9E7"]}
            tintColor="#04D9E7"
          />
        }
      >
        <View style={styles.inputContainer}>
          <View style={styles.overlay}>
            <Text style={styles.title}>Abonnement actif</Text>
          </View>

          {/* First Card - Active Subscription */}
          <View style={styles.firstcard}>
            <Text style={styles.firstcardTitle}>
              {isSubscriptionActive() ? getOffreName(activeSubscription!.offreId) : "Aucun abonnement actif"}
            </Text>
            <View style={styles.firstcardLine} />
            <View style={styles.priceRow}>
              <Text style={styles.priceNumber}>
                {isSubscriptionActive() ? `${activeSubscription!.amount} CHF` : "00 CHF"}
              </Text>
              <Text style={styles.priceText}>
                {isSubscriptionActive() ? "/période" : "/mois"}
              </Text>
            </View>
            
            {/* Next billing date button */}
            <TouchableOpacity style={styles.firstcardButton}>
              <Text style={styles.cardButtonText}>
                Date de la prochaine facture{"\n"}
                {isSubscriptionActive() ? getNextBillingDate() : "Non disponible"}
              </Text>
            </TouchableOpacity>

            {/* Cancel subscription button - Only show when user has an active subscription */}
            {isSubscriptionActive() && (
              <TouchableOpacity 
                style={styles.cancelSubscriptionButton}
                onPress={() => 
                  showCustomAlertMessage(
                    "Annuler l'abonnement",
                    "Êtes-vous sûr de vouloir annuler votre abonnement ? Les paiements automatiques seront arrêtés et vous ne serez plus facturé.",
                    handleCancelSubscription,
                    () => console.log("Cancel subscription cancelled")
                  )
                }
              >
                <Text style={styles.cancelButtonText}>
                  Annuler l'abonnement
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Second Card - Payment History */}
          <View style={styles.secondecard}>
            <Text style={styles.secondecardTitle}>Historique</Text>

            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, index) => (
                <View style={styles.specialbuttonRow} key={payment.idpay || index}>
                  <View style={styles.paymentInfo}>
                    <Text style={styles.titlechiffre}>Transaction #{payment.idpay || index + 1}</Text> 
                    <Text style={styles.historique}>
                      {formatDate(payment.createdAt)} - {getOffreName(payment.offreId)}
                    </Text>
                  </View>
                  <Text style={styles.money}>{payment.amount} CHF</Text>

                  <TouchableOpacity 
                    style={styles.downloadWrapper}
                    onPress={() => handleDownloadPDF(payment)}
                    disabled={downloadingId === payment.idpay}
                  >
                    {downloadingId === payment.idpay ? (
                      <ActivityIndicator size="small" color="#04D9E7" />
                    ) : (
                      <>
                        <Image
                          source={require("../../assets/images/Rectangledownload.png")}                          
                          style={styles.rectangleDownload}
                        />
                        <Image
                          source={require("../../assets/images/IconDownload.png")}                          
                          style={styles.iconDownload}
                        />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noHistoryText}>Aucun historique de paiement</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: height * 0.1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden",
  },
  overlay: { 
    alignItems: "center" 
  },
  blueOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "#080808" 
  },
  title: { 
    fontSize: width * 0.06, 
    fontWeight: "bold", 
    color: "#080808", 
    textAlign: "center" 
  },
  inputContainer: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 20 
  },
  icon: { 
    marginTop: 10, 
    width: 20, 
    height: 30, 
    resizeMode: "contain" 
  },
  firstcard: {
    width: width * 0.9,
    backgroundColor: "#080808",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
    marginTop: 20,
  },
  firstcardTitle: { 
    fontSize: width * 0.05, 
    fontWeight: "bold", 
    color: "#04D9E7", 
    marginBottom: 10, 
    textAlign: "center" 
  },
  firstcardLine: { 
    width: "95%", 
    height: 1.5, 
    backgroundColor: "#FFFFFF", 
    marginBottom: 20 
  },
  firstcardButton: { 
    width: width * 0.8, 
    backgroundColor: "transparent", 
    paddingVertical: 12, 
    paddingHorizontal: 25, 
    borderRadius: 20, 
    borderColor: "#FFFFFF", 
    borderWidth: 2, 
    marginTop: 20 
  },
  cardButtonText: { 
    color: "#fff", 
    fontSize: width * 0.035, 
    fontWeight: "bold", 
    textAlign: "center" 
  },
  priceRow: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "flex-end", 
    marginTop: 20 
  },
  priceNumber: { 
    fontSize: width * 0.09, 
    fontWeight: "bold", 
    color: "#FFFFFF", 
    marginRight: 5 
  },
  priceText: { 
    fontSize: width * 0.035, 
    fontWeight: "bold", 
    color: "#FFFFFF" 
  },
  specialbuttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 15, 
    width: "100%", 
    paddingHorizontal: 20 
  },
  paymentInfo: {
    flex: 1,
  },
  secondecard: {
    width: width * 0.9,
    backgroundColor: "#F4F5FA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
    marginTop: 20,
  },
  secondecardTitle: { 
    fontSize: width * 0.08, 
    fontWeight: "bold", 
    color: "#04D9E7", 
    marginBottom: 10, 
    textAlign: "center" 
  },
  titlechiffre: { 
    fontSize: width * 0.03, 
    fontWeight: "bold", 
    color: "#828282", 
    textAlign: "left" 
  },
  historique: { 
    fontSize: width * 0.03, 
    color: "#828282", 
    marginTop: 2 
  },
  money: { 
    fontSize: width * 0.04, 
    color: "#080808", 
    marginTop: 1, 
    marginLeft: 20 
  },
  downloadWrapper: { 
    width: 80, 
    height: 80, 
    justifyContent: "center", 
    alignItems: "center", 
    position: "relative" 
  },
  rectangleDownload: { 
    width: 40, 
    height: 40, 
    resizeMode: "contain" 
  },
  iconDownload: { 
    position: "absolute", 
    width: 20, 
    height: 20, 
    resizeMode: "contain" 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5FA'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#080808'
  },
  noHistoryText: {
    fontSize: width * 0.04,
    color: '#828282',
    textAlign: 'center',
    marginTop: 20
  },
  // Cancel subscription button styles
  cancelSubscriptionButton: {
    width: width * 0.8,
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: width * 0.035,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  customAlert: {
    width: width * 0.85,
    backgroundColor: '#080808',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  alertHeader: {
    backgroundColor: '#04D9E7',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#080808',
    textAlign: 'center'
  },
  alertBody: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertMessage: {
    fontSize: width * 0.045,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500'
  },
  alertFooter: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  alertButton: {
    backgroundColor: '#04D9E7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 120,
    flex: 1
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#04D9E7'
  },
  alertButtonText: {
    color: '#080808',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  alertButtonTextSecondary: {
    color: '#04D9E7'
  }
});

export default Abonnement;