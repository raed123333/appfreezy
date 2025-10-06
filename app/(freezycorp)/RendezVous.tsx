import { API } from '@/config';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Dimensions, Image, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get("window");

const RendezVous = () => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [preBookedDates, setPreBookedDates] = useState<{ idAppoin: number, date: string, time: string, statusAppoi: string }[]>([]);
  const [allAppointments, setAllAppointments] = useState<{ idAppoin: number, date: string, time: string, statusAppoi: string, user: any }[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [holidays, setHolidays] = useState<{ dateConge: string }[]>([]);
  const [interventionLimits, setInterventionLimits] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [refreshSubscription, setRefreshSubscription] = useState(0);

  const getUserId = () => {
    if (user?.idU) return user.idU;
    if (user?.id) return user.id;
    if (user?.utilisateur?.idU) return user.utilisateur.idU;
    return null;
  };

  const getToken = () => user?.token || null;

  // Check if user has active subscription
  useEffect(() => {
    const checkUserSubscription = async () => {
      try {
        if (!user) {
          setHasActiveSubscription(false);
          return;
        }

        const token = user?.token || null;

        if (!token) {
          setHasActiveSubscription(false);
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

          const hasSucceededPayments = payments.some((payment: any) =>
            payment.status === 'succeeded' || payment.status === 'completed'
          );

          setHasActiveSubscription(hasSucceededPayments);
        } else {
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      }
    };

    checkUserSubscription();
  }, [user, refreshSubscription]);

  useEffect(() => {
    const userId = getUserId();
    if (userId && hasActiveSubscription) {
      fetchUserAppointments(userId);
      fetchAllAppointments();
      fetchHolidays();
      fetchInterventionLimits();
    }
  }, [user, hasActiveSubscription]);

  useEffect(() => {
    if (selectedDate && hasActiveSubscription) fetchAvailableTimeSlots(selectedDate);
  }, [selectedDate, hasActiveSubscription]);

  const fetchInterventionLimits = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/appointment/limits/interventions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setInterventionLimits(response.data);
    } catch (error: any) {
      console.error("Error fetching intervention limits:", error.response || error.message);
    }
  };

  const fetchHolidays = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/conge/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setHolidays(response.data);
    } catch (error: any) {
      console.error("Error fetching holidays:", error.response || error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const userId = getUserId();
    if (userId && hasActiveSubscription) {
      await fetchUserAppointments(userId);
      await fetchAllAppointments();
      await fetchHolidays();
      await fetchInterventionLimits();
      if (selectedDate) {
        await fetchAvailableTimeSlots(selectedDate);
      }
    }
    // Always refresh subscription status on pull-to-refresh
    setRefreshSubscription(prev => prev + 1);
    setRefreshing(false);
  };

  const fetchUserAppointments = async (userId: number) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/appointment/user/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = response.data;
      const formattedAppointments = data.map((app: any) => ({
        idAppoin: app.idAppoin,
        date: app.dateAppoi,
        time: app.timeAppoi,
        statusAppoi: app.statusAppoi,
        payment: app.Payment // Include payment info if needed
      }));
      setPreBookedDates(formattedAppointments);

    } catch (error: any) {
      if (error.response?.status === 404) {
        setPreBookedDates([]);
      } else {
        console.error("Error fetching appointments:", error.response || error.message);
        // Set empty array to avoid breaking the UI
        setPreBookedDates([]);
      }
    }
  };
  const fetchAllAppointments = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/appointment/all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = response.data;
      const formatted = data.map((app: any) => ({
        idAppoin: app.idAppoin,
        date: app.dateAppoi,
        time: app.timeAppoi,
        statusAppoi: app.statusAppoi,
        user: app.Utilisateur
      }));
      setAllAppointments(formatted);

    } catch (error: any) {
      console.error("Error fetching all appointments:", error.response || error.message);
    }
  };

  const fetchAvailableTimeSlots = async (date: string) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/appointment/available/${date}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = response.data;
      setAvailableSlots(data.availableSlots || []);

      if (selectedTime && !data.availableSlots.includes(selectedTime)) {
        setSelectedTime(data.availableSlots[0] || "");
      }
    } catch (error: any) {
      console.error("Error fetching available slots:", error.response || error.message);
      setAvailableSlots([]);
    }
  };

  const handleDatePress = (day: any) => {
    if (!hasActiveSubscription) {
      Alert.alert(
        "Abonnement Requis",
        "Acheter un offre pour avant chose un rendez-vous",
        [
          {
            text: "Voir les offres",
            onPress: () => {
              router.navigate('/OurOffers');
            }
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    const isHoliday = holidays.some(holiday => holiday.dateConge === day.dateString);
    if (isHoliday) {
      setErrorMessage("Cette date est un jour de congé, veuillez choisir une autre date.");
      return;
    }

    setSelectedDate(day.dateString);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleAddReservation = async () => {
    if (!hasActiveSubscription) {
      Alert.alert(
        "Abonnement Requis",
        "Acheter un offre pour avant chose un rendez-vous",
        [
          {
            text: "Voir les offres",
            onPress: () => {
              router.navigate('/OurOffers');
            }
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMessage("Veuillez sélectionner une date et une heure.");
      return;
    }

    const isHoliday = holidays.some(holiday => holiday.dateConge === selectedDate);
    if (isHoliday) {
      setErrorMessage("Cette date est un jour de congé, veuillez choisir une autre date.");
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setErrorMessage("Vous devez être connecté pour prendre un rendez-vous.");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(`${API}/appointment/`, {
        utilisateurId: userId,
        dateAppoi: selectedDate,
        timeAppoi: selectedTime
      }, {
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        }
      });

      setSuccessMessage("Rendez-vous réservé avec succès!");
      setErrorMessage("");
      fetchUserAppointments(userId);
      fetchAllAppointments();
      fetchAvailableTimeSlots(selectedDate);
      fetchInterventionLimits();

    } catch (error: any) {
      console.log(error);
      if (error.response?.data?.error) {
        Alert.alert("Erreur", error.response.data.error);
      }
      setErrorMessage(error.response?.data?.error || "Erreur de connexion au serveur");
    }
  };

  const handleCancelAppointment = async (idAppoin: number) => {
    try {
      
      const token = getToken();
      
      await axios.patch(`${API}/appointment/${idAppoin}/cancel`, {}, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      setSuccessMessage("Rendez-vous annulé avec succès!");
      setErrorMessage("");
      const userId = getUserId();
      if (userId) {
        fetchUserAppointments(userId);
        fetchInterventionLimits();
      }
      fetchAllAppointments();
      if (selectedDate) fetchAvailableTimeSlots(selectedDate);

    } catch (error: any) {
      console.error("Error canceling appointment:", error.response || error.message);
      setErrorMessage(error.response?.data?.error || "Erreur de connexion au serveur");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getMarkedDates = () => {
    const markedDates: any = {};

    if (selectedDate) {
      markedDates[selectedDate] = { selected: true, selectedColor: '#04D9E7' };
    }

    preBookedDates.forEach(item => {
      if (item.statusAppoi === 'Non_confirmé' || item.statusAppoi === 'confirmé') {
        markedDates[item.date] = { disabled: true, marked: true, dotColor: "red" };
      }
    });

    holidays.forEach(holiday => {
      markedDates[holiday.dateConge] = {
        disabled: true,
        marked: true,
        dotColor: "orange",
        customStyles: {
          container: {
            backgroundColor: '#ff9966',
            borderRadius: 8,
          },
          text: {
            color: 'white',
            fontWeight: 'bold',
          }
        }
      };
    });

    return markedDates;
  };

  const renderInterventionLimits = () => {
    if (!hasActiveSubscription) {
      return (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Abonnement Requis</Text>
          <Text style={styles.limitError}>
            Vous devez acheter une offre pour prendre un rendez-vous
          </Text>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => router.navigate('/OurOffers')}
          >
            <Text style={styles.subscriptionButtonText}>Voir les offres</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subscriptionButton, { backgroundColor: '#013743', marginTop: 10 }]}
            onPress={() => setRefreshSubscription(prev => prev + 1)}
          >
            <Text style={styles.subscriptionButtonText}>Actualiser le statut</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!interventionLimits) return null;

    if (!interventionLimits.allowed) {
      return (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Limite d'Interventions</Text>
          <Text style={styles.limitError}>{interventionLimits.reason}</Text>
        </View>
      );
    }

    return (
      <View style={styles.limitCard}>
        <Text style={styles.limitTitle}>Vos Interventions</Text>
        <Text style={styles.limitText}>
          Utilisées: {interventionLimits.interventionsUtilisees} / {interventionLimits.interventionsMax}
        </Text>
        <Text style={styles.limitText}>
          Restantes: {interventionLimits.interventionsRestantes}
        </Text>
      </View>
    );
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
          {successMessage ? (
            <Text style={{ color: "green", marginBottom: 10, textAlign: "center" }}>{successMessage}</Text>
          ) : null}
          {errorMessage ? (
            <Text style={{ color: "red", marginBottom: 10, textAlign: "center" }}>{errorMessage}</Text>
          ) : null}

          {renderInterventionLimits()}

          {hasActiveSubscription && (
            <>
              <View style={styles.holidayCard}>
                <Text style={styles.holidayCardTitle}>Jours de Congé</Text>
                {holidays.length > 0 ? (
                  holidays.map((holiday, index) => (
                    <View style={styles.holidayItem} key={index}>
                      <Text style={styles.holidayDate}>{holiday.dateConge}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.historique}>Aucun jour de congé programmé</Text>
                )}
              </View>

              <View style={styles.secondecard}>
                <Text style={styles.secondecardTitle}>Tous les Rendez-vous</Text>
                {allAppointments.filter(item => item.statusAppoi !== "effectué").length > 0 ? (
                  allAppointments
                    .filter(item => item.statusAppoi !== "effectué")
                    .map((item, index) => (
                      <View style={styles.specialbuttonRow} key={item.idAppoin}>
                        <View>
                          <Text style={styles.titlechiffre}>Réservation #{index + 1}</Text>
                          <Text style={styles.historique}>{item.date}, {item.time}</Text>
                          <Text style={styles.historique}>
                            Utilisateur: {item.user?.nom} {item.user?.prenom}
                          </Text>
                          <Text style={[styles.historique, { color: item.statusAppoi == "confirmé" ? "green" : item.statusAppoi == "Non_confirmé" ? "orange":"red" }]}>
                            Statut: {item.statusAppoi}
                          </Text>
                        </View>
                      </View>
                    ))
                ) : (
                  <Text style={styles.historique}>Aucun rendez-vous trouvé</Text>
                )}
              </View>

              <View style={styles.secondecard}>
                <Text style={styles.secondecardTitle}>Mes Rendez-vous</Text>
                {preBookedDates.filter(item => item.statusAppoi !== "effectué").length > 0 ? (
                  preBookedDates
                    .filter(item => item.statusAppoi !== "effectué")
                    .map((item, index) => (
                      <View style={styles.specialbuttonRow} key={item.idAppoin}>
                        <View>
                          <Text style={styles.titlechiffre}>Réservation #{index + 1}</Text>
                          <Text style={styles.historique}>{item.date}, {item.time}</Text>
                          <Text style={styles.historique}>
                            Statut: {item.statusAppoi}
                          </Text>
                        </View>
                        {(item.statusAppoi !== "confirmé" && item.statusAppoi !== "effectué") && (
                          <TouchableOpacity onPress={() => handleCancelAppointment(item.idAppoin)}>
                            <Text style={styles.cancelText}>Annuler</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                ) : (
                  <Text style={styles.historique}>Aucun rendez-vous prévu</Text>
                )}
              </View>

              <View style={styles.firstcard}>
                <Text style={styles.firstcardTitle}>Choisir la date</Text>
                <View style={styles.firstcardLine} />

                <Calendar
                  onDayPress={handleDatePress}
                  markingType={'custom'}
                  markedDates={getMarkedDates()}
                  theme={{
                    backgroundColor: '#013743',
                    calendarBackground: '#013743',
                    textSectionTitleColor: '#fff',
                    selectedDayBackgroundColor: '#04D9E7',
                    selectedDayTextColor: '#fff',
                    todayTextColor: '#04D9E7',
                    dayTextColor: '#fff',
                    arrowColor: '#04D9E7',
                    monthTextColor: '#04D9E7',
                    disabledArrowColor: '#d9e1e8',
                  }}
                  hideExtraDays={true}
                  firstDay={1}
                  enableSwipeMonths={true}
                  disabledByDefault={false}
                />

                <View style={{
                  borderColor: '#fff',
                  borderWidth: 2,
                  borderRadius: 20,
                  width: width * 0.8,
                  marginTop: 15,
                  overflow: 'hidden',
                  backgroundColor: 'transparent'
                }}>
                  <Picker
                    selectedValue={selectedTime}
                    onValueChange={(itemValue) => setSelectedTime(itemValue)}
                    style={{ color: '#fff', width: '100%' }}
                    dropdownIconColor="#04D9E7"
                  >
                    {availableSlots.length > 0 ? (
                      availableSlots.map(time => (
                        <Picker.Item key={time} label={time} value={time} />
                      ))
                    ) : (
                      <Picker.Item label="Aucun créneau disponible" value="" />
                    )}
                  </Picker>
                </View>

                <TouchableOpacity
                  style={[styles.firstcardButton, (availableSlots.length === 0 || (interventionLimits && !interventionLimits.allowed)) && { opacity: 0.5 }]}
                  onPress={handleAddReservation}
                  disabled={availableSlots.length === 0 || (interventionLimits && !interventionLimits.allowed)}
                >
                  <Text style={styles.cardButtonText}>
                    {selectedDate ? `Réserver: ${selectedDate} ${selectedTime}` : "Sélectionner date et heure"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    height: height * 0.1
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden"
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#013743"
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
    backgroundColor: "#013743",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20
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
    borderRadius: 20,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    marginTop: 20
  },
  cardButtonText: {
    color: "#fff",
    fontSize: width * 0.05,
    fontWeight: "bold",
    textAlign: "center"
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
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
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
    color: "#828282"
  },
  historique: {
    fontSize: width * 0.03,
    color: "#828282",
    marginTop: 2
  },
  cancelText: {
    color: 'red',
    fontSize: width * 0.035,
    fontWeight: 'bold'
  },
  holidayCard: {
    width: width * 0.9,
    backgroundColor: "#FFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  holidayCardTitle: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#04D9E7",
    marginBottom: 10,
    textAlign: "center"
  },
  holidayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
    paddingHorizontal: 10
  },
  holidayDate: {
    fontSize: width * 0.04,
    color: "#828282",
    fontWeight: "bold"
  },
  limitCard: {
    width: width * 0.9,
    backgroundColor: "#013743",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 20
  },
  limitTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#04D9E7",
    marginBottom: 10,
    textAlign: "center"
  },
  limitText: {
    fontSize: width * 0.04,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 5
  },
  limitError: {
    fontSize: width * 0.04,
    color: "#FF6B6B",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10
  },
  subscriptionButton: {
    backgroundColor: "#04D9E7",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10
  },
  subscriptionButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
    fontWeight: "bold"
  }
});

export default RendezVous;