import { API } from "@/config";
import { Link, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from '../context/AuthContext';
import PDFService from '../services/PDFService';

const { width, height } = Dimensions.get("window");

// Define the Subscription interface matching OurOffers
interface Subscription {
  id: number;
  subscriptionId: string;
  status: string;
  isActive: boolean;
  isCanceled: boolean;
  nextBillingDate: string;
  subscriptionEndDate: string;
  offreId: number;
  amount: number;
  createdAt: string;
  updatedAt: string;
  dateFin: string;
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
  isCanceled: boolean;
  subscriptionEndDate: string;
}

// Safe date validation function
const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  if (dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

// Safe date creation function
const safeCreateDate = (dateStr: string): Date => {
  if (!isValidDate(dateStr)) return new Date();
  return new Date(dateStr);
};

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

  // FIXED: Improved active subscription fetch with better error handling and fallback
  const fetchActiveSubscription = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available");
        setActiveSubscription(null);
        return;
      }

      console.log("🔄 Fetching active subscriptions...");

      // First try the active-subscriptions endpoint
      try {
        const response = await fetch(`${API}/payment/active-subscriptions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const subscriptions = await response.json();
          console.log("📋 Active subscriptions response:", subscriptions);
          
          if (Array.isArray(subscriptions) && subscriptions.length > 0) {
            // Find the first active subscription
            const activeSub = subscriptions.find((sub: Subscription) => 
              sub.isActive === true && 
              ['succeeded', 'active', 'paid', 'active_until_period_end'].includes(sub.status)
            );

            if (activeSub) {
              console.log("✅ Found active subscription:", activeSub);
              setActiveSubscription(activeSub);
              return;
            } else {
              console.log("⚠️ No active subscription found in array");
            }
          } else {
            console.log("📭 No subscriptions array or empty array");
          }
        } else {
          console.log("❌ Active subscriptions endpoint failed:", response.status);
        }
      } catch (error) {
        console.log("⚠️ Active subscriptions endpoint error:", error);
      }

      // Fallback: Check payment history for active subscriptions
      console.log("🔄 Falling back to payment history check...");
      try {
        const paymentResponse = await fetch(`${API}/payment/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (paymentResponse.ok) {
          const payments: Payment[] = await paymentResponse.json();
          console.log("💰 Payment history entries:", payments?.length || 0);

          // Find the most recent active payment
          const activePayment = payments.find((payment: Payment) => {
            const hasValidStatus = ['succeeded', 'active', 'paid', 'completed', 'active_until_period_end'].includes(payment.status);
            const isActive = payment.isActive === true;
            
            // Check if dateFin is valid and in the future
            let isNotExpired = true;
            if (isValidDate(payment.dateFin)) {
              const endDate = safeCreateDate(payment.dateFin);
              isNotExpired = endDate > new Date();
            }
            
            return hasValidStatus && isActive && isNotExpired;
          });

          if (activePayment) {
            console.log("✅ Found active payment to use as subscription:", activePayment);
            // Convert payment to subscription format
            const subscriptionFromPayment: Subscription = {
              id: activePayment.idpay,
              subscriptionId: activePayment.paymentIntentId || activePayment.idpay.toString(),
              status: activePayment.status,
              isActive: activePayment.isActive,
              isCanceled: activePayment.isCanceled,
              nextBillingDate: activePayment.dateFin,
              subscriptionEndDate: activePayment.subscriptionEndDate || activePayment.dateFin,
              offreId: activePayment.offreId || 1,
              amount: activePayment.amount,
              createdAt: activePayment.createdAt,
              updatedAt: activePayment.updatedAt,
              dateFin: activePayment.dateFin
            };
            setActiveSubscription(subscriptionFromPayment);
            return;
          }
        }
      } catch (error) {
        console.log("❌ Payment history fallback failed:", error);
      }

      // If we get here, no active subscription found
      console.log("❌ No active subscription found");
      setActiveSubscription(null);

    } catch (error) {
      console.error("❌ Error fetching subscription data:", error);
      setActiveSubscription(null);
    }
  };

  // UPDATED: Fetch ALL payment history (including old offers and canceled subscriptions)
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
        
        // UPDATED: Show ALL payments regardless of status
        setPaymentHistory(payments);
        
        console.log("All payment history loaded:", payments.length, "payments");
      } else {
        console.error("Failed to fetch payment history:", response.status);
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
      3: "Real offres",
      6: "Semestrielle",
      12: "Annuelle"
    };
    return offreId ? (offreNames[offreId] || "Mensuelle") : "Mensuelle";
  };

  // UPDATED: Get payment status display text
  const getPaymentStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'succeeded': 'Payé',
      'completed': 'Complété',
      'active': 'Actif',
      'active_until_period_end': 'Actif jusqu\'à fin période',
      'canceled': 'Annulé',
      'failed': 'Échoué',
      'pending': 'En attente',
      'setup_required': 'Configuration requise',
      'incomplete': 'Incomplet',
      'past_due': 'En retard'
    };
    return statusMap[status] || status;
  };

  // UPDATED: Get payment status color
  const getPaymentStatusColor = (status: string): string => {
    const statusColorMap: { [key: string]: string } = {
      'succeeded': '#4CAF50',
      'completed': '#4CAF50',
      'active': '#4CAF50',
      'active_until_period_end': '#FF9800',
      'canceled': '#F44336',
      'failed': '#F44336',
      'pending': '#FFC107',
      'setup_required': '#FFC107',
      'incomplete': '#FFC107',
      'past_due': '#F44336'
    };
    return statusColorMap[status] || '#828282';
  };

  const formatDate = (dateString: string): string => {
    if (!isValidDate(dateString)) return "Date non disponible";
    
    try {
      const date = safeCreateDate(dateString);
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      return "Date invalide";
    }
  };

  // UPDATED FUNCTION: Get the subscription end date for display
  const getSubscriptionEndDate = (): string => {
    if (!activeSubscription) {
      return "Non disponible";
    }
    
    try {
      // Priority 1: Use subscriptionEndDate (the actual end date)
      if (isValidDate(activeSubscription.subscriptionEndDate)) {
        return formatDate(activeSubscription.subscriptionEndDate);
      }
      
      // Priority 2: Use dateFin from database
      if (isValidDate(activeSubscription.dateFin)) {
        return formatDate(activeSubscription.dateFin);
      }
      
      // Priority 3: Use nextBillingDate as fallback
      if (isValidDate(activeSubscription.nextBillingDate)) {
        return formatDate(activeSubscription.nextBillingDate);
      }
      
      return "Date non disponible";
      
    } catch (error) {
      console.error("Error calculating subscription end date:", error);
      return "Date invalide";
    }
  };

  // UPDATED FUNCTION: Get days until subscription end
  const getDaysUntilSubscriptionEnd = (): number => {
    if (!activeSubscription) return 0;
    
    try {
      let endDate: Date | null = null;
      
      // Try to get date from subscriptionEndDate field
      if (isValidDate(activeSubscription.subscriptionEndDate)) {
        endDate = safeCreateDate(activeSubscription.subscriptionEndDate);
      }
      
      // If not available, try dateFin
      if (!endDate && isValidDate(activeSubscription.dateFin)) {
        endDate = safeCreateDate(activeSubscription.dateFin);
      }
      
      // If still not available, use nextBillingDate
      if (!endDate && isValidDate(activeSubscription.nextBillingDate)) {
        endDate = safeCreateDate(activeSubscription.nextBillingDate);
      }
      
      if (!endDate) return 0;
      
      const today = new Date();
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return daysDiff > 0 ? daysDiff : 0;
    } catch (error) {
      console.error("Error calculating days until subscription end:", error);
      return 0;
    }
  };

  // Cancel subscription function - using updated logic
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
          "Votre abonnement a été annulé avec succès. Il restera actif jusqu'à la fin de la période déjà payée. Aucun paiement futur ne sera effectué.",
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
      },
      () => {
        // Cancel action - do nothing
        console.log("Logout cancelled");
      }
    );
  };

  // UPDATED: Check if subscription is active (including canceled but still active subscriptions)
  const isSubscriptionActive = (): boolean => {
    if (!activeSubscription) return false;
    
    const hasValidStatus = ['succeeded', 'active', 'paid', 'active_until_period_end'].includes(activeSubscription.status);
    const isActive = activeSubscription.isActive === true;
    
    // Check if dateFin is valid and in the future
    let isNotExpired = true;
    if (isValidDate(activeSubscription.dateFin)) {
      const endDate = safeCreateDate(activeSubscription.dateFin);
      isNotExpired = endDate > new Date();
    }
    
    return hasValidStatus && isActive && isNotExpired;
  };

  // NEW: Check if subscription is canceled but still active
  const isSubscriptionCanceledButActive = (): boolean => {
    return isSubscriptionActive() && activeSubscription!.isCanceled === true;
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
                  {alertConfig.onConfirm ? "Se déconnecter" : "OK"}
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
            
            {/* Show cancellation status */}
            {isSubscriptionCanceledButActive() && (
              <View style={styles.canceledBadge}>
                <Text style={styles.canceledBadgeText}>Annulé - Actif jusqu'à la fin de la période</Text>
              </View>
            )}
            
            <View style={styles.firstcardLine} />
            <View style={styles.priceRow}>
              <Text style={styles.priceNumber}>
                {isSubscriptionActive() ? `${activeSubscription!.amount} CHF` : "00 CHF"}
              </Text>
              <Text style={styles.priceText}>
                {isSubscriptionActive() ? "/période" : "/mois"}
              </Text>
            </View>
            
            {/* UPDATED: Subscription status message */}
            <TouchableOpacity style={styles.firstcardButton}>
              <Text style={styles.cardButtonText}>
                {isSubscriptionCanceledButActive() ? "Votre abonnement reste actif jusqu'au" : "Prochaine facturation"}{"\n"}
                <Text style={styles.nextBillingDate}>
                  {isSubscriptionActive() ? getSubscriptionEndDate() : "Non disponible"}
                </Text>
                {isSubscriptionActive() && getDaysUntilSubscriptionEnd() > 0 && (
                  <Text style={styles.daysRemaining}>
                    {"\n"}Dans {getDaysUntilSubscriptionEnd()} jour(s)
                  </Text>
                )}
              </Text>
            </TouchableOpacity>

            {/* Cancel subscription button - Only show when user has an active, non-canceled subscription */}
            {isSubscriptionActive() && !isSubscriptionCanceledButActive() && (
              <TouchableOpacity 
                style={styles.cancelSubscriptionButton}
                onPress={() => 
                  showCustomAlertMessage(
                    "Annuler l'abonnement",
                    "Êtes-vous sûr de vouloir annuler votre abonnement ? Votre abonnement restera actif jusqu'à la fin de la période déjà payée. Aucun paiement futur ne sera effectué.",
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

            {/* Show message if subscription is already canceled */}
            {isSubscriptionCanceledButActive() && (
              <View style={styles.canceledMessage}>
                <Text style={styles.canceledMessageText}>
                  Votre abonnement a été annulé mais reste actif jusqu'à la fin de la période.
                </Text>
              </View>
            )}
          </View>

          {/* Second Card - Payment History */}
          <View style={styles.secondecard}>
            <Text style={styles.secondecardTitle}>Historique des paiements</Text>
            
            {/* UPDATED: Show total count of payments */}
            <Text style={styles.paymentCountText}>
              {paymentHistory.length} paiement(s) au total
            </Text>

            {paymentHistory.length > 0 ? (
              paymentHistory.map((payment, index) => (
                <View style={styles.paymentItem} key={payment.idpay || index}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.titlechiffre}>
                        Transaction #{payment.idpay || index + 1} - {getOffreName(payment.offreId)}
                      </Text> 
                      <Text style={styles.historique}>
                        {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                    <Text style={styles.money}>{payment.amount} CHF</Text>
                  </View>
                  
                  {/* UPDATED: Show payment status */}
                  <View style={styles.paymentStatusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(payment.status) }]}>
                      <Text style={styles.statusText}>
                        {getPaymentStatusText(payment.status)}
                      </Text>
                    </View>
                    
                    {/* UPDATED: Show download button for successful payments AND active_until_period_end status */}
                    {(payment.status === 'succeeded' || payment.status === 'completed' || payment.status === 'active' || payment.status === 'active_until_period_end') && (
                      <TouchableOpacity 
                        style={styles.downloadWrapper}
                        onPress={() => handleDownloadPDF(payment)}
                        disabled={downloadingId === payment.idpay}
                      >
                        {downloadingId === payment.idpay ? (
                          <ActivityIndicator size="small" color="#04D9E7" />
                        ) : (
                          <>
                            <View style={styles.squareDownload} />
                            <Image
                              source={require("../../assets/images/IconDownload.png")}                          
                              style={styles.iconDownload}
                            />
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Show additional info for canceled subscriptions */}
                  {payment.isCanceled && (
                    <View style={styles.canceledInfo}>
                      <Text style={styles.canceledInfoText}>
                        ✓ Abonnement annulé - Période payée honorée
                      </Text>
                    </View>
                  )}
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
    position: 'relative',
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
  nextBillingDate: {
    fontSize: width * 0.04,
    fontWeight: "bold",
    color: "#04D9E7",
  },
  daysRemaining: {
    fontSize: width * 0.03,
    color: "#FFFFFF",
    fontStyle: "italic",
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
  paymentCountText: {
    fontSize: width * 0.035,
    color: "#828282",
    textAlign: "center",
    marginBottom: 15,
    fontStyle: "italic",
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
    marginLeft: 20,
    fontWeight: "bold",
  },
  paymentItem: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  paymentStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: width * 0.025,
    fontWeight: "bold",
    textAlign: "center",
  },
  downloadWrapper: { 
    width: 60, 
    height: 40, 
    justifyContent: "center", 
    alignItems: "center", 
    position: "relative" 
  },
  squareDownload: { 
    width: 35, 
    height: 35, 
    backgroundColor: "#080808",
    borderRadius: 4,
  },
  iconDownload: { 
    position: "absolute", 
    width: 18, 
    height: 18, 
    resizeMode: "contain" 
  },
  canceledInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#FFA500",
  },
  canceledInfoText: {
    fontSize: width * 0.025,
    color: "#FFA500",
    fontWeight: "500",
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
  canceledBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 10,
  },
  canceledBadgeText: {
    color: '#FFFFFF',
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
  canceledMessage: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  canceledMessageText: {
    color: '#FFA500',
    fontSize: width * 0.03,
    textAlign: 'center',
    fontWeight: '500',
  },
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