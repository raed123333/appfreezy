import { API } from '@/config';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const { user, logout, getAuthToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [holidays, setHolidays] = useState<{ dateConge: string }[]>([]);
  const [interventionLimits, setInterventionLimits] = useState<any>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [refreshSubscription, setRefreshSubscription] = useState(0);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    type: '', 
    onConfirm: null as (() => void) | null,
    showCancel: false 
  });
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // helper: normalize status string to strip accents, underscores, spaces and lowercase
  const normalizeStatus = (status?: string | null) => {
    if (!status) return "";
    try {
      return status.toString()
        .normalize('NFD') // decompose accents
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9]/gi, '') // remove non-alphanumeric
        .toLowerCase();
    } catch (e) {
      return status.toString().toLowerCase().replace(/[^a-z0-9]/gi, '');
    }
  };

  // Function to show custom alert
  const showCustomAlertMessage = (title: string, message: string, type: string = 'info', onConfirm?: () => void, showCancel: boolean = false) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm: onConfirm || null,
      showCancel
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

  // Add logout alert function
  const handleLogout = () => {
    showCustomAlertMessage(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      'warning',
      () => logout(),
      true
    );
  };

  // FIXED: Simplified user ID extraction
  const getUserId = () => {
    if (!user) return null;
    
    // Try multiple possible locations for user ID
    const userId = user?.idU || user?.id || user?.utilisateur?.idU || user?.utilisateur?.id;
    return userId;
  };

  // FIXED: Simplified token retrieval
  const getToken = (): string | null => {
    if (!user) return null;
    
    // Try multiple possible locations for token
    const token = user?.token || user?.utilisateur?.token;
    return token;
  };

  // FIXED: COMPLETELY REWRITTEN subscription check - SIMPLIFIED AND MORE RELIABLE
  useEffect(() => {
    const checkUserSubscription = async () => {
      try {
        setIsLoading(true);
        console.log("🔄 Fetching data for user:", user ? "User exists" : "No user");
        
        if (!user) {
          console.log("❌ No user found - setting hasActiveSubscription to false");
          setHasActiveSubscription(false);
          setIsLoading(false);
          return;
        }

        const token = getToken();
        console.log("🔑 Token available:", !!token);

        if (!token) {
          console.log("❌ No token available - setting hasActiveSubscription to false");
          setHasActiveSubscription(false);
          setIsLoading(false);
          return;
        }

        // Method 1: Try payment history first (more reliable)
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
            console.log("💰 Payment history entries:", payments?.length || 0);

            // SIMPLIFIED LOGIC: Check for any payment that is active and not expired
            const hasValidPayment = payments?.some((payment: any) => {
              const hasValidStatus = ['succeeded', 'active', 'paid', 'completed', 'active_until_period_end'].includes(payment.status);
              const isActive = payment.isActive === true;
              
              // Check if dateFin is in the future
              let isNotExpired = true;
              if (payment.dateFin && payment.dateFin !== '0000-00-00') {
                try {
                  const endDate = new Date(payment.dateFin);
                  isNotExpired = !isNaN(endDate.getTime()) && endDate > new Date();
                } catch (e) {
                  console.log("Invalid dateFin, considering as valid");
                }
              }
              
              const isValid = hasValidStatus && isActive && isNotExpired;
              
              if (isValid) {
                console.log(`✅ Valid payment found: ${payment.idpay}`, {
                  status: payment.status,
                  isActive: payment.isActive,
                  dateFin: payment.dateFin,
                  isNotExpired
                });
              }
              
              return isValid;
            });

            console.log("🎯 Final hasActiveSubscription from payments:", hasValidPayment);
            setHasActiveSubscription(hasValidPayment);
            
            // If we found valid payments, we're done
            if (hasValidPayment) {
              setIsLoading(false);
              return;
            }
          } else {
            console.log("❌ Payment history response not OK:", response.status);
          }
        } catch (error) {
          console.log("⚠️ Payment history endpoint failed:", error);
        }

        // Method 2: Fallback to active subscriptions endpoint
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
            console.log("📋 Active subscriptions found:", subscriptions?.length || 0);
            
            const hasActiveSub = Array.isArray(subscriptions) && subscriptions.length > 0 && 
                               subscriptions.some((sub: any) => {
                                 const isActive = sub.isActive === true;
                                 const hasValidStatus = ['succeeded', 'active', 'paid', 'active_until_period_end'].includes(sub.status);
                                 
                                 let isNotExpired = true;
                                 if (sub.dateFin && sub.dateFin !== '0000-00-00') {
                                   try {
                                     const endDate = new Date(sub.dateFin);
                                     isNotExpired = !isNaN(endDate.getTime()) && endDate > new Date();
                                   } catch (e) {
                                     console.log("Invalid dateFin in subscription, considering as valid");
                                   }
                                 }
                                 
                                 return isActive && hasValidStatus && isNotExpired;
                               });
            
            console.log("🎯 Final hasActiveSubscription from subscriptions:", hasActiveSub);
            setHasActiveSubscription(hasActiveSub);
          } else {
            console.log("❌ Active subscriptions response not OK:", response.status);
            setHasActiveSubscription(false);
          }
        } catch (error) {
          console.error("❌ Error checking active subscriptions:", error);
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("❌ Error in subscription check:", error);
        setHasActiveSubscription(false);
      } finally {
        setIsLoading(false);
        console.log("🎯 Final hasActiveSubscription state:", hasActiveSubscription);
      }
    };

    checkUserSubscription();
  }, [user, refreshSubscription]);

  // FIXED: Simplified data fetching
  useEffect(() => {
    const fetchData = async () => {
      // Only fetch data if user has active subscription AND we're not loading
      if (hasActiveSubscription && !isLoading) {
        const userId = getUserId();
        const token = getToken();
        
        if (userId && token) {
          console.log("🔄 Fetching appointment data for user:", userId);
          await fetchUserAppointments(userId);
          await fetchAllAppointments();
          await fetchHolidays();
          await fetchInterventionLimits();
        }
      }
    };

    fetchData();
  }, [hasActiveSubscription, isLoading]);

  useEffect(() => {
    if (selectedDate && hasActiveSubscription && !isLoading) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate, hasActiveSubscription, isLoading]);

  const fetchInterventionLimits = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await axios.get(`${API}/appointment/limits/interventions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setInterventionLimits(response.data);
    } catch (error: any) {
      console.error("Error fetching intervention limits:", error.response?.data || error.message);
    }
  };

  const fetchHolidays = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await axios.get(`${API}/conge/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setHolidays(response.data);
    } catch (error: any) {
      console.error("Error fetching holidays:", error.response?.data || error.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Refresh subscription status first
    setRefreshSubscription(prev => prev + 1);
    
    // Then refresh other data if user has active subscription
    if (hasActiveSubscription) {
      const userId = getUserId();
      const token = getToken();
      
      if (userId && token) {
        await fetchUserAppointments(userId);
        await fetchAllAppointments();
        await fetchHolidays();
        await fetchInterventionLimits();
        if (selectedDate) {
          await fetchAvailableTimeSlots(selectedDate);
        }
      }
    }
    
    setRefreshing(false);
  };

  const fetchUserAppointments = async (userId: number) => {
    try {
      const token = getToken();
      if (!token) {
        setPreBookedDates([]);
        return;
      }

      const response = await axios.get(`${API}/appointment/user/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = response.data;
      const formattedAppointments = data.map((app: any) => ({
        idAppoin: app.idAppoin,
        date: app.dateAppoi,
        time: app.timeAppoi,
        statusAppoi: app.statusAppoi,
        payment: app.Payment
      }));
      setPreBookedDates(formattedAppointments);

    } catch (error: any) {
      if (error.response?.status === 404) {
        setPreBookedDates([]);
      } else {
        console.error("Error fetching appointments:", error.response?.data || error.message);
        setPreBookedDates([]);
      }
    }
  };

  const fetchAllAppointments = async () => {
    try {
      const token = getToken();
      if (!token) return;

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
      console.error("Error fetching all appointments:", error.response?.data || error.message);
    }
  };

  const fetchAvailableTimeSlots = async (date: string) => {
    try {
      const token = getToken();
      if (!token) {
        setAvailableSlots([]);
        return;
      }

      const response = await axios.get(`${API}/appointment/available/${date}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = response.data;
      setAvailableSlots(data.availableSlots || []);

      if (selectedTime && !data.availableSlots.includes(selectedTime)) {
        setSelectedTime(data.availableSlots[0] || "");
      }
    } catch (error: any) {
      console.error("Error fetching available slots:", error.response?.data || error.message);
      setAvailableSlots([]);
    }
  };

  const showCancelConfirmation = (idAppoin: number) => {
    setAppointmentToCancel(idAppoin);
    showCustomAlertMessage(
      "⚠️ Confirmation de suppression",
      "Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action ne peut pas être annulée.",
      'warning',
      async () => {
        try {
          const token = getToken();
          if (!token) {
            setErrorMessage("Erreur d'authentification. Veuillez vous reconnecter.");
            return;
          }
          
          await axios.delete(`${API}/appointment/${idAppoin}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });

          // Refresh data
          const userId = getUserId();
          if (userId) {
            await fetchUserAppointments(userId);
            await fetchAllAppointments();
            await fetchAvailableTimeSlots(selectedDate);
            await fetchInterventionLimits();
          }

          showCustomAlertMessage("Succès", "Votre rendez-vous a été annulé avec succès. ✅");

        } catch (error: any) {
          console.error("Error canceling appointment:", error.response?.data || error.message);
          setErrorMessage(error.response?.data?.error || "Erreur de connexion au serveur");
        }
      },
      true
    );
  };

  const handleDatePress = (day: any) => {
    if (!hasActiveSubscription && !isLoading) {
      showCustomAlertMessage(
        "Abonnement Requis",
        "Vous devez avoir un abonnement actif pour prendre un rendez-vous.",
        'info',
        () => router.navigate('/OurOffers')
      );
      return;
    }

    if (isLoading) {
      showCustomAlertMessage(
        "Chargement",
        "Vérification de votre abonnement en cours...",
        'info'
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
    if (!hasActiveSubscription && !isLoading) {
      showCustomAlertMessage(
        "Abonnement Requis",
        "Vous devez avoir un abonnement actif pour prendre un rendez-vous.",
        'info',
        () => router.navigate('/OurOffers')
      );
      return;
    }

    if (isLoading) {
      showCustomAlertMessage(
        "Chargement",
        "Vérification de votre abonnement en cours...",
        'info'
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
      if (!token) {
        setErrorMessage("Erreur d'authentification. Veuillez vous reconnecter.");
        return;
      }

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

      showCustomAlertMessage("Succès", "Votre demande de prise de rendez-vous a été effectuée avec succès. ✅");

      // Refresh data
      await fetchUserAppointments(userId);
      await fetchAllAppointments();
      await fetchAvailableTimeSlots(selectedDate);
      await fetchInterventionLimits();

    } catch (error: any) {
      console.log("Appointment error:", error);
      if (error.response?.data?.error) {
        showCustomAlertMessage("Erreur", error.response.data.error);
      }
      setErrorMessage(error.response?.data?.error || "Erreur de connexion au serveur");
    }
  };

  const getMarkedDates = () => {
    const markedDates: any = {};

    if (selectedDate) {
      markedDates[selectedDate] = { selected: true, selectedColor: '#04D9E7' };
    }

    preBookedDates.forEach(item => {
      const ns = normalizeStatus(item.statusAppoi);
      // mark dates if confirmed or non-confirmed (normalized)
      if (ns === 'nonconfirme' || ns === 'confirme' || ns === 'confirmed') {
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

  const getStatusColor = (status: string) => {
    const ns = normalizeStatus(status);
    switch (ns) {
      case "confirme":
      case "confirmed":
        return "green";
      case "nonconfirme":
      case "nonconfirmed":
        return "orange";
      case "annule":
      case "annulee":
        return "red";
      case "effectue":
      case "effectuee":
        return "blue";
      default:
        return "#828282";
    }
  };

  const renderInterventionLimits = () => {
    if (isLoading) {
      return (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Vérification...</Text>
          <Text style={styles.limitText}>Vérification de votre abonnement en cours</Text>
        </View>
      );
    }

    if (!hasActiveSubscription) {
      return (
        <View style={styles.limitCard}>
          <Text style={styles.limitTitle}>Abonnement Requis</Text>
          <Text style={styles.limitError}>
            Vous devez avoir un abonnement actif pour prendre un rendez-vous
          </Text>
          <TouchableOpacity
            style={styles.subscriptionButton}
            onPress={() => router.navigate('/OurOffers')}
          >
            <Text style={styles.subscriptionButtonText}>Voir les offres</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subscriptionButton, { backgroundColor: '#080808', marginTop: 10 }]}
            onPress={() => {
              setRefreshSubscription(prev => prev + 1);
            }}
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
              {alertConfig.showCancel ? (
                <>
                  <TouchableOpacity 
                    style={[styles.alertButton, styles.alertButtonSecondary]}
                    onPress={handleCustomAlertClose}
                  >
                    <Text style={[styles.alertButtonText, styles.alertButtonSecondaryText]}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.alertButton, alertConfig.type === 'warning' && styles.alertButtonWarning]}
                    onPress={handleCustomAlertConfirm}
                  >
                    <Text style={styles.alertButtonText}>
                      {alertConfig.type === 'warning' ? 'Confirmer' : 'OK'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={styles.alertButton}
                  onPress={handleCustomAlertClose}
                >
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              )}
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

          {hasActiveSubscription && !isLoading && (
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
                <Text style={styles.secondecardTitle}>Mes Rendez-vous</Text>
                {preBookedDates.length > 0 ? (
                  preBookedDates
                    .map((item, index) => {
                      const ns = normalizeStatus(item.statusAppoi);

                      return (
                        <View style={styles.appointmentItem} key={item.idAppoin}>
                          <View style={styles.appointmentInfo}>
                            <Text style={styles.titlechiffre}>Réservation #{index + 1}</Text>
                            <Text style={styles.historique}>{item.date}, {item.time}</Text>
                            <Text style={[styles.statusText, { color: getStatusColor(item.statusAppoi) }]}>
                              Statut: {item.statusAppoi}
                            </Text>
                          </View>

                          {/* MODIFICATION: Show cancel button only when status is non-confirmed */}
                          {/* For confirmed status, show only the status badge without any button - just like effectue status */}
                          {ns.startsWith('non') ? (
                            <TouchableOpacity 
                              style={styles.cancelButton}
                              onPress={() => showCancelConfirmation(item.idAppoin)}
                            >
                              <Text style={styles.cancelText}>Annuler</Text>
                            </TouchableOpacity>
                          ) : (ns.includes('confirmé')||ns.includes('confirme') || ns.includes('confirmed')) && !ns.includes('effectue') && !ns.includes('confirmé') ? (
                            <View style={styles.confirmedBadge}>
                              <Text style={styles.confirmedText}>Confirmé</Text>
                            </View>
                          ) : null}
                          {/* For effectuee and conformie status, no button is shown - just the status text */}
                        </View>
                      );
                    })
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
                    backgroundColor: '#080808',
                    calendarBackground: '#080808',
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

                <View style={styles.pickerContainer}>
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
    backgroundColor: "#080808"
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
  appointmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  appointmentInfo: {
    flex: 1
  },
  titlechiffre: {
    fontSize: width * 0.035,
    fontWeight: "bold",
    color: "#080808",
    marginBottom: 4
  },
  historique: {
    fontSize: width * 0.033,
    color: "#828282",
    marginTop: 2
  },
  statusText: {
    fontSize: width * 0.033,
    fontWeight: "bold",
    marginTop: 4
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: width * 0.033,
    fontWeight: 'bold'
  },
  confirmedBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  confirmedText: {
    color: '#FFFFFF',
    fontSize: width * 0.033,
    fontWeight: 'bold'
  },
  holidayCard: {
    width: width * 0.9,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#080808",
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
  },
  pickerContainer: {
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 20,
    width: width * 0.8,
    marginTop: 15,
    overflow: 'hidden',
    backgroundColor: 'transparent'
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
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 100,
    flex: 1
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#04D9E7'
  },
  alertButtonWarning: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B'
  },
  alertButtonText: {
    color: '#080808',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  alertButtonSecondaryText: {
    color: '#04D9E7'
  }
});

export default RendezVous;