import { API } from "@/config";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get("window");

const OurOffersComponent = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [offres, setOffres] = useState([]);
  const [filteredOffres, setFilteredOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [selectedPeriod, setSelectedPeriod] = useState('mensuelle');
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: null,
    onCancel: null 
  });

  // Function to show custom alert
  const showCustomAlertMessage = (title, message, onConfirm, onCancel) => {
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

  const getToken = () => user?.token || null;

  useEffect(() => {
    console.log("User object:", user);
    if (user) {
      console.log("User properties:", Object.keys(user));
      if (user.utilisateur) {
        console.log("Utilisateur nom:", user.utilisateur.nom);
        console.log("Utilisateur prenom:", user.utilisateur.prenom);
      }
    }
  }, [user]);

  // Fetch active subscription - UPDATED
  useEffect(() => {
    const fetchActiveSubscription = async () => {
      try {
        const token = getToken();
        if (!token) {
          setSubscriptionLoading(false);
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
            // Get the latest active subscription with correct status
            const latestActiveSubscription = subscriptions.find(sub => 
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
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user) {
      fetchActiveSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (offres.length > 0) {
      let filtered = [];

      switch (selectedPeriod) {
        case 'mensuelle':
          filtered = offres.filter(offre => offre.duree === 1);
          break;
        case 'trimestrielle':
          filtered = offres.filter(offre => offre.duree === 3);
          break;
        case 'semestrielle':
          filtered = offres.filter(offre => offre.duree === 6);
          break;
        case 'annuelle':
          filtered = offres.filter(offre => offre.duree === 12);
          break;
        default:
          filtered = offres;
      }

      setFilteredOffres(filtered);
    }
  }, [offres, selectedPeriod]);

  const fetchOffres = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API}/offre`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffres(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des offres :", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffres();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOffres();

    // Also refresh subscription data
    const token = getToken();
    if (token) {
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
          if (Array.isArray(subscriptions) && subscriptions.length > 0) {
            const latestActiveSubscription = subscriptions.find(sub => 
              sub.isActive === true && 
              ['succeeded', 'active', 'paid'].includes(sub.status)
            ) || subscriptions[0];
            setActiveSubscription(latestActiveSubscription);
          } else {
            setActiveSubscription(null);
          }
        }
      } catch (error) {
        console.error("Error refreshing subscription data:", error);
      }
    }
  };

  const getUserDisplayName = () => {
    if (isLoading) return "Chargement...";
    if (!user) return "Nom & Prènom";
    if (user.utilisateur && user.utilisateur.nom && user.utilisateur.prenom)
      return `${user.utilisateur.nom} ${user.utilisateur.prenom}`;
    else if (user.nom !== undefined && user.prenom !== undefined)
      return `${user.nom} ${user.prenom}`;
    else if (user.parent && user.parent.nom && user.parent.prenom)
      return `${user.parent.prenom} ${user.parent.nom}`;
    else if (user.name) return user.name;
    else if (user.email) return user.email;
    else return "Nom & Prènom";
  };

  const getPeriodDisplayName = (period) => {
    switch (period) {
      case 'mensuelle': return 'Mensuelle';
      case 'trimestrielle': return 'Trimestrielle';
      case 'semestrielle': return 'Semestrielle';
      case 'annuelle': return 'Annuelle';
      default: return period;
    }
  };

  const canPurchaseNewOffer = () => {
    if (!activeSubscription) {
      console.log("Pas d'abonnement actif - possibilité d'achat");
      return true;
    }

    return !activeSubscription.isActive || !['succeeded', 'active', 'paid'].includes(activeSubscription.status);
  };

  const handleSubscription = async (price, offreId, offreTitle, duree) => {
    // Check if user can purchase new offer
    if (!canPurchaseNewOffer()) {
      showCustomAlertMessage(
        "Abonnement actif",
        "Vous avez déjà un abonnement en cours. Vous devez d'abord annuler votre abonnement actuel avant de souscrire à une nouvelle offre."
      );
      return;
    }

    try {
      const token = getToken();

      console.log("Créer un abonnement pour:", {
        amount: price,
        description: `Abonnement: ${offreTitle} - ${getPeriodDisplayName(selectedPeriod)}`,
        offreId,
        duree
      });

      // Use the setup intent method as fallback
      const response = await axios.post(
        `${API}/payment/create-subscription-setup`,
        {
          amount: price,
          description: `Abonnement: ${offreTitle} - ${getPeriodDisplayName(selectedPeriod)}`,
          offreId: offreId || null,
          duree: duree
        },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      console.log("Réponse de configuration d'abonnement:", response.data);

      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret: response.data.clientSecret,
        merchantDisplayName: "FreezyCorp",
      });

      if (initError) {
        console.error("Erreur dans la feuille de paiement:", initError.message);
        showCustomAlertMessage("Erreur", initError.message);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.log("Payment error:", paymentError);
        showCustomAlertMessage("Erreur de paiement", paymentError.message);
      } else {
        // Payment method setup successful - complete the subscription
        const completeResponse = await axios.post(
          `${API}/payment/complete-subscription`,
          {
            setupIntentId: response.data.setupIntentId,
            paymentId: response.data.paymentId
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Abonnement terminé:", completeResponse.data);
        
        // Refresh subscription data
        const subscriptionResponse = await fetch(`${API}/payment/active-subscriptions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (subscriptionResponse.ok) {
          const subscriptions = await subscriptionResponse.json();
          if (Array.isArray(subscriptions) && subscriptions.length > 0) {
            const latestActiveSubscription = subscriptions.find(sub => 
              sub.isActive === true && 
              ['succeeded', 'active', 'paid'].includes(sub.status)
            ) || subscriptions[0];
            setActiveSubscription(latestActiveSubscription);
          }
          
          showCustomAlertMessage(
            "Félicitations!",
            "Votre abonnement a été activé avec succès! Les paiements seront automatiquement renouvelés. Vous pouvez maintenant prendre rendez-vous.",
            () => router.navigate('/RendezVous')
          );
        }
      }
    } catch (err) {
      console.error("Erreur de processus d'abonnement:", err);
      if (err.response) {
        console.error("Backend error response:", err.response.data);
        showCustomAlertMessage("Erreur", err.response.data.error || "Erreur lors de la souscription");
      } else {
        showCustomAlertMessage("Erreur", "Erreur de connexion");
      }
    }
  };

  const getDurationText = (duree) => {
    switch (duree) {
      case 1: return "1 mois";
      case 3: return "3 mois";
      case 6: return "6 mois";
      case 12: return "12 mois";
      default: return `${duree} mois`;
    }
  };

  const getSubscriptionStatusMessage = () => {
    if (subscriptionLoading) return "Vérification de votre abonnement...";

    if (activeSubscription && activeSubscription.isActive && ['succeeded', 'active', 'paid'].includes(activeSubscription.status)) {
      const nextBillingDate = new Date(activeSubscription.nextBillingDate);
      const today = new Date();

      const nextBillingOnly = new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), nextBillingDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const daysLeft = Math.ceil((nextBillingOnly - todayOnly) / (1000 * 60 * 60 * 24));

      return `Abonnement actif - Prochain paiement dans ${daysLeft} jour(s)`;
    }

    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderCard = (offre, index) => {
    const isHovered = hoveredCard === index;
    const handlePressIn = () => setHoveredCard(index);
    const handlePressOut = () => setTimeout(() => setHoveredCard(null), 10);

    const canPurchase = canPurchaseNewOffer();
    const subscriptionMessage = getSubscriptionStatusMessage();

    // Check if this is the active subscription offer
    const isActiveSubscription = activeSubscription && 
                                activeSubscription.offreId === offre.idOffre && 
                                activeSubscription.isActive && 
                                ['succeeded', 'active', 'paid'].includes(activeSubscription.status);

    return (
      <Pressable
        key={index}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          isHovered ? styles.firstcard : styles.secondecard,
        ]}
      >
        {/* Show "Abonnement actif" tag on the active subscription offer */}
        {isActiveSubscription && (
          <View style={styles.overlayActive}>
            <Text style={styles.activeText}>Abonnement actif</Text>
          </View>
        )}

        <Text style={isHovered ? styles.firstcardTitle : styles.secondecardTitle}>
          {offre.titre}
        </Text>

        <Text style={isHovered ? styles.firstcardParagraph : styles.secondecardParagraph}>
          {offre.description || "Idéale pour une flexibilité maximale, sans engagement à long terme."}
        </Text>

        {subscriptionMessage && isActiveSubscription && (
          <Text style={styles.subscriptionMessage}>
            {subscriptionMessage}
            {activeSubscription.nextBillingDate && (
              <Text style={styles.nextBillingDate}>
                {"\n"}Prochaine facturation: {formatDate(activeSubscription.nextBillingDate)}
              </Text>
            )}
          </Text>
        )}

        <View style={isHovered ? styles.firstcardLine : styles.secondecardLine} />

        {(Array.isArray(offre.attributs) ? offre.attributs : JSON.parse(offre.attributs || '[]')).map((f, idx) => (
          <View style={styles.buttonRow} key={idx}>
            <Image
              source={isHovered ? require("../../assets/images/check.png") : require("../../assets/images/secondecheck.png")}
              style={styles.uiRectangle}
            />
            <Text style={isHovered ? styles.firstfeatureText : styles.secondefeatureText}>
              {f}
            </Text>
          </View>
        ))}

        <View style={styles.interventionsContainer}>
          <View style={styles.buttonRow}>
            <Text style={isHovered ? styles.firstfeatureText : styles.secondefeatureText}>
              {offre.nombreDeInterventions || 0} intervention(s) incluse(s)
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceNumber}>{offre.prix} CHF</Text>
          <Text style={styles.priceText}>
            / {getDurationText(offre.duree)}
          </Text>
        </View>

        {isActiveSubscription ? (
          <TouchableOpacity
            style={[styles.cancelButton, styles.disabledButton]}
            disabled={true}
          >
            <Text style={styles.cardButtonText}>
              Abonnement actif
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              isHovered ? styles.firstcardButton : styles.secondecardButton,
              !canPurchase && styles.disabledButton
            ]}
            onPress={() => handleSubscription(offre.prix, offre.idOffre, offre.titre, offre.duree)}
            disabled={!canPurchase}
          >
            <Text style={styles.cardButtonText}>
              {canPurchase ? "Souscrire maintenant" : "Abonnement en cours"}
            </Text>
          </TouchableOpacity>
        )}
      </Pressable>
    );
  };

  const getPeriodDisplayText = () => {
    switch (selectedPeriod) {
      case 'mensuelle': return 'mensuelle';
      case 'trimestrielle': return 'trimestrielle';
      case 'semestrielle': return 'semestrielle';
      case 'annuelle': return 'annuelle';
      default: return '';
    }
  };

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

      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.specialbuttonRow}>
            <View>
              <Text style={styles.titleBonjour}>Bonjour</Text>
              <Text style={styles.nomPrenom}>
                {getUserDisplayName()}
              </Text>
            </View>
            <Link href="./Menu" asChild>
              <TouchableOpacity>
                <Image
                  source={require("../../assets/images/iconHome.png")}
                  style={styles.search}
                />
              </TouchableOpacity>
            </Link>
          </View>
        </ImageBackground>
      </View>

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
            <Text style={styles.title}>Nos Offres</Text>
            <Text style={styles.sectionText}>
              Choisissez la formule qui correspond le mieux à{'\n'}
              vos besoins et à votre budget
            </Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedPeriod === 'mensuelle' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setSelectedPeriod('mensuelle')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedPeriod === 'mensuelle' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                ]}>
                  Mensuelle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedPeriod === 'trimestrielle' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setSelectedPeriod('trimestrielle')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedPeriod === 'trimestrielle' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                ]}>
                  Trimestrielle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedPeriod === 'semestrielle' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setSelectedPeriod('semestrielle')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedPeriod === 'semestrielle' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                ]}>
                  Semestrielle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedPeriod === 'annuelle' ? styles.toggleButtonActive : styles.toggleButtonInactive
                ]}
                onPress={() => setSelectedPeriod('annuelle')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedPeriod === 'annuelle' ? styles.toggleButtonTextActive : styles.toggleButtonTextInactive
                ]}>
                  Annuelle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <Text style={{ color: "#fff", marginTop: 20 }}>Chargement...</Text>
          ) : filteredOffres.length === 0 ? (
            <Text style={{ color: "#080808", marginTop: 20, textAlign: "center" }}>
              Aucune offre {getPeriodDisplayText()} disponible pour le moment.
            </Text>
          ) : (
            filteredOffres.map((offre, idx) => renderCard(offre, idx))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const OurOffers = () => (
  <StripeProvider
    publishableKey="pk_test_51S8KF50gBNJMsTlUYepi4PtYqsOfbeXJ3lh8jwSHoFfEl1KgfHNpiRYDwiREiuTWZO52I949SpfFPjBv1mQZIgPQ00iIce3TQ8"
    merchantIdentifier="merchant.com.yourapp"
  >
    <OurOffersComponent />
  </StripeProvider>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: height * 0.1
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden"
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
  sectionText: {
    fontSize: width * 0.035,
    marginBottom: 20,
    textAlign: "center",
    color: "#A5A5A5"
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30
  },
  search: {
    marginTop: 10,
    width: 80,
    height: 20,
    resizeMode: "contain"
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    width: "100%",
    paddingHorizontal: 20
  },
  titleBonjour: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#04D9E7",
    textAlign: "left"
  },
  nomPrenom: {
    fontSize: width * 0.04,
    color: "#FFFFFF",
    marginTop: 2
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
  firstcardParagraph: {
    fontSize: width * 0.035,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 15
  },
  firstcardLine: {
    width: "95%",
    height: 1.5,
    backgroundColor: "#FFFFFF",
    marginBottom: 20
  },
  firstfeatureText: {
    flex: 1,
    fontSize: width * 0.03,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  firstcardButton: {
    width: width * 0.8,
    backgroundColor: "#04D9E7",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20
  },
  cardButtonText: {
    color: "#fff",
    fontSize: width * 0.04,
    fontWeight: "bold",
    textAlign: "center"
  },
  uiRectangle: {
    width: 30,
    height: 20,
    resizeMode: "contain",
    marginRight: 8
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
    color: "#04D9E7",
    marginRight: 5
  },
  priceText: {
    fontSize: width * 0.035,
    fontWeight: "bold",
    color: "#04D9E7"
  },
  specialbuttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    width: "100%",
    paddingHorizontal: 20
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
    position: 'relative',
  },
  secondecardTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#080808",
    marginBottom: 10,
    textAlign: "center"
  },
  secondecardParagraph: {
    fontSize: width * 0.035,
    color: "#000000",
    textAlign: "center",
    marginBottom: 15
  },
  secondecardLine: {
    width: "95%",
    height: 1.5,
    backgroundColor: "#04D9E7",
    marginBottom: 20
  },
  secondefeatureText: {
    flex: 1,
    fontSize: width * 0.03,
    fontWeight: "bold",
    color: "#000000"
  },
  secondecardButton: {
    width: width * 0.8,
    backgroundColor: "#080808",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F5FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 90,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#080808',
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
  },
  toggleButtonText: {
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleButtonTextInactive: {
    color: '#080808',
  },
  interventionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#A5A5A5',
  },
  subscriptionMessage: {
    fontSize: width * 0.03,
    color: '#04D9E7',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  nextBillingDate: {
    fontSize: width * 0.025,
    color: '#FFFFFF',
    fontStyle: 'normal',
  },
  // Active subscription tag styles
  overlayActive: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  activeText: {
    color: '#FFFFFF',
    fontSize: width * 0.03,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: width * 0.8,
    backgroundColor: '#A5A5A5',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20
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

export default OurOffers;