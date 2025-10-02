import { API } from "@/config";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, ImageBackground, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get("window");

const OurOffersComponent = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [offres, setOffres] = useState([]);
  const [filteredOffres, setFilteredOffres] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [clientSecret, setClientSecret] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('mensuelle');
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch active subscription
  useEffect(() => {
    const fetchActiveSubscription = async () => {
      try {
        const token = getToken();
        if (!token) {
          setSubscriptionLoading(false);
          return;
        }

        const response = await fetch(`${API}/payment/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const payments = await response.json();

          if (Array.isArray(payments)) {
            // Filter successful payments and find the latest active one
            const succeededPayments = payments.filter(payment =>
              payment.status === 'succeeded' || payment.status === 'completed'
            );

            const latestActivePayment = succeededPayments.sort((a, b) =>
              new Date(b.createdAt || b.dateDebut).getTime() - new Date(a.createdAt || a.dateDebut).getTime()
            )[0] || null;

            // Check if subscription is still active
            if (latestActivePayment && latestActivePayment.dateFin) {
              const endDate = new Date(latestActivePayment.dateFin);
              const today = new Date();

              // Compare dates without time to avoid timezone issues
              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

              if (endDateOnly > todayOnly) {
                setActiveSubscription(latestActivePayment);
              } else {
                setActiveSubscription(null);
              }
            } else {
              setActiveSubscription(null);
            }
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
        const response = await fetch(`${API}/payment/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const payments = await response.json();

          if (Array.isArray(payments)) {
            const succeededPayments = payments.filter(payment =>
              payment.status === 'succeeded' || payment.status === 'completed'
            );

            const latestActivePayment = succeededPayments.sort((a, b) =>
              new Date(b.createdAt || b.dateDebut).getTime() - new Date(a.createdAt || a.dateDebut).getTime()
            )[0] || null;

            if (latestActivePayment && latestActivePayment.dateFin) {
              const endDate = new Date(latestActivePayment.dateFin);
              const today = new Date();

              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

              if (endDateOnly > todayOnly) {
                setActiveSubscription(latestActivePayment);
              } else {
                setActiveSubscription(null);
              }
            } else {
              setActiveSubscription(null);
            }
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
      console.log("No active subscription - can purchase");
      return true;
    }

    if (activeSubscription.dateFin) {
      const endDate = new Date(activeSubscription.dateFin);
      const today = new Date();

      // Compare dates without time to avoid timezone issues
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const canPurchase = endDateOnly <= todayOnly;

      console.log("Subscription end date:", endDateOnly);
      console.log("Today:", todayOnly);
      console.log("Can purchase:", canPurchase);

      return canPurchase;
    }

    console.log("No end date - can purchase");
    return true;
  };

  const handlePayment = async (price, offreId, offreTitle, duree) => {
    // Check if user can purchase new offer
    if (!canPurchaseNewOffer()) {
      Alert.alert(
        "Abonnement actif",
        "Vous avez déjà un abonnement en cours. Vous ne pouvez pas acheter une nouvelle offre avant la fin de votre abonnement actuel.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const token = getToken();

      const response = await axios.post(
        `${API}/payment/create-payment-intent`,
        {
          amount: price,
          description: `Achat Offre: ${offreTitle} - ${getPeriodDisplayName(selectedPeriod)}`,
          offreId: offreId || null,
          duree: duree
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: response.data.clientSecret,
        merchantDisplayName: "FreezyCorp",
      });

      if (initError) {
        console.error("Erreur initPaymentSheet:", initError.message);
        Alert.alert("Erreur", initError.message);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        console.log("Payment error:", paymentError);
        Alert.alert("Erreur de paiement", paymentError.message);
      } else {
        const confirmResponse = await axios.post(
          `${API}/payment/confirm`,
          {
            paymentIntentId: response.data.paymentIntentId,
            status: "succeeded"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Payment confirmed:", confirmResponse.data);
        Alert.alert("Succès", "Paiement effectué avec succès!");

        // Refresh subscription data after successful payment
        const subscriptionResponse = await fetch(`${API}/payment/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (subscriptionResponse.ok) {
          const payments = await subscriptionResponse.json();
          const succeededPayments = payments.filter(payment =>
            payment.status === 'succeeded' || payment.status === 'completed'
          );

          const latestActivePayment = succeededPayments.sort((a, b) =>
            new Date(b.createdAt || b.dateDebut).getTime() - new Date(a.createdAt || a.dateDebut).getTime()
          )[0] || null;

          setActiveSubscription(latestActivePayment);
          
          // Show success message with option to go to RendezVous
          Alert.alert(
            "Félicitations!",
            "Votre abonnement a été activé avec succès! Vous pouvez maintenant prendre rendez-vous.",
            [
              {
                text: "Prendre Rendez-vous",
                onPress: () => {
                  router.navigate('/RendezVous');
                }
              },
              {
                text: "Continuer",
                style: "cancel"
              }
            ]
          );
        }
      }
    } catch (err) {
      console.error("Payment process error:", err);
      if (err.response) {
        console.error("Backend error response:", err.response.data);
        Alert.alert("Erreur", err.response.data.error || "Erreur lors du paiement");
      } else {
        Alert.alert("Erreur", "Erreur de connexion");
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

    if (activeSubscription) {
      const endDate = new Date(activeSubscription.dateFin);
      const today = new Date();

      // Compare dates without time to avoid timezone issues
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const daysLeft = Math.ceil((endDateOnly - todayOnly) / (1000 * 60 * 60 * 24));

      return `Abonnement actif - Expire dans ${daysLeft} jour(s)`;
    }

    return null;
  };

  const renderCard = (offre, index) => {
    const isHovered = hoveredCard === index;
    const handlePressIn = () => setHoveredCard(index);
    const handlePressOut = () => setTimeout(() => setHoveredCard(null), 10);

    const canPurchase = canPurchaseNewOffer();
    const subscriptionMessage = getSubscriptionStatusMessage();

    return (
      <Pressable
        key={index}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          isHovered ? styles.firstcard : styles.secondecard,
          !canPurchase && styles.disabledCard
        ]}
      >
        {!canPurchase && (
          <View style={styles.overlayDisabled}>
            <Text style={styles.disabledText}>Abonnement actif</Text>
          </View>
        )}

        <Text style={isHovered ? styles.firstcardTitle : styles.secondecardTitle}>{offre.titre}</Text>

        <Text style={isHovered ? styles.firstcardParagraph : styles.secondecardParagraph}>
          {offre.description || "Idéale pour une flexibilité maximale, sans engagement à long terme."}
        </Text>

        {subscriptionMessage && (
          <Text style={styles.subscriptionMessage}>
            {subscriptionMessage}
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

        <TouchableOpacity
          style={[
            isHovered ? styles.firstcardButton : styles.secondecardButton,
            !canPurchase && styles.disabledButton
          ]}
          onPress={() => handlePayment(offre.prix, offre.idOffre, offre.titre, offre.duree)}
          disabled={!canPurchase}
        >
          <Text style={styles.cardButtonText}>
            {canPurchase ? "Profitez maintenant" : "Abonnement actif"}
          </Text>
        </TouchableOpacity>
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
            <Text style={{ color: "#013743", marginTop: 20, textAlign: "center" }}>
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
    backgroundColor: "#013743"
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#013743",
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
    backgroundColor: "#013743",
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
    color: "#013743",
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
    backgroundColor: "#013743",
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
    backgroundColor: '#013743',
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
    color: '#013743',
  },
  interventionsContainer: {
    width: '100%',
    marginTop: 10,
  },
  disabledCard: {
    opacity: 0.7,
  },
  overlayDisabled: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    zIndex: 10,
  },
  disabledText: {
    color: '#FFFFFF',
    fontSize: width * 0.03,
    fontWeight: 'bold',
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
});

export default OurOffers;