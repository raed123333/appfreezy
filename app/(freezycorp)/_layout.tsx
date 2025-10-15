import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from '../context/AuthContext';

// ✅ Import your custom icons
import { API } from '@/config';
import AbonnementIcon from "../../assets/images/iconAbonnement.png";
import HomeIcon from "../../assets/images/iconAccueil.png";
import OffersIcon from "../../assets/images/iconNosOffres.png";
import ProfileIcon from "../../assets/images/iconProfile.png";

const { width } = Dimensions.get("window");

// Custom tab with icon and label in the same line
function CustomTabIcon({ icon, label, color, focused, isIonicon = false }: 
  { icon: any; label: string; color: string; focused: boolean; isIonicon?: boolean }) {
  
  // ✅ Custom style for RendezVous Ionicon to match other icons
  const iconStyle = isIonicon
    ? {
        width: 50,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
      }
    : {
        width: 50,
        height: 20,
      };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: focused ? 12 : 0,
        paddingVertical: focused ? 6 : 0,
        borderRadius: focused ? 20 : 0,
        backgroundColor: focused ? "#080808" : "transparent",
      }}
    >
      {isIonicon ? (
        <View style={iconStyle}>
          <Ionicons
            name={icon}
            size={20} // match image height
            color={focused ? "#FFFFFF" : color} // white on focus
            style={{ alignSelf: "center" }}
          />
        </View>
      ) : (
        <Image
          source={icon}
          style={{
            width: 50,
            height: 20,
            tintColor: focused ? "#FFFFFF" : color,
            marginRight: label !== "" ? 6 : 0,
          }}
          resizeMode="contain"
        />
      )}
      {label !== "" && (
        <Text
          style={{
            color: focused ? "#FFFFFF" : color,
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 18,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export default function FreezyCorpLayout() {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [refreshSubscription, setRefreshSubscription] = useState(0);
  const [showCustomAlert, setShowCustomAlert] = useState(false);

  // Check if user has an active subscription - UPDATED
  useEffect(() => {
    const checkUserSubscription = async () => {
      try {
        if (!user) {
          setHasActiveSubscription(false);
          return;
        }

        const token = user?.token || user?.utilisateur?.token || null;
        
        if (!token) {
          setHasActiveSubscription(false);
          return;
        }

        // Fetch user's active subscriptions
        const response = await fetch(`${API}/payment/active-subscriptions`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const subscriptions = await response.json();
          
          // Check if user has any active subscriptions with correct status
          const hasActiveSub = Array.isArray(subscriptions) && subscriptions.length > 0 && 
                             subscriptions.some((sub: any) => 
                               sub.isActive === true && 
                               ['succeeded', 'active', 'paid'].includes(sub.status)
                             );
          
          setHasActiveSubscription(hasActiveSub);
        } else {
          // Fallback to payment history
          const paymentResponse = await fetch(`${API}/payment/history`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          if (paymentResponse.ok) {
            const payments = await paymentResponse.json();
            
            // Check if user has any successful payments
            const hasSucceededPayments = payments.some((payment: any) => 
              ['succeeded', 'active', 'paid', 'completed'].includes(payment.status) &&
              payment.isActive === true
            );
            
            setHasActiveSubscription(hasSucceededPayments);
          } else {
            setHasActiveSubscription(false);
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      }
    };

    checkUserSubscription();
  }, [user, refreshSubscription]);

  // Function to handle RendezVous tab press
  const handleRendezVousPress = (e: any) => {
    if (!hasActiveSubscription) {
      // Prevent default navigation
      e.preventDefault();
      
      // Show custom alert instead of native alert
      setShowCustomAlert(true);
    }
  };

  // Function to handle custom alert close
  const handleCustomAlertClose = () => {
    setShowCustomAlert(false);
  };

  // Function to handle "Voir les offres" button press
  const handleViewOffers = () => {
    setShowCustomAlert(false);
    router.navigate('/OurOffers');
  };

  // Function to refresh subscription status (can be called from other components)
  const refreshSubscriptionStatus = () => {
    setRefreshSubscription(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
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
              <Text style={styles.alertTitle}>Abonnement Requis</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>
                Acheter un offre pour avant chose un rendez-vous
              </Text>
            </View>
            <View style={styles.alertFooter}>
              <TouchableOpacity 
                style={[styles.alertButton, styles.alertButtonSecondary]}
                onPress={handleCustomAlertClose}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonSecondaryText]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={handleViewOffers}
              >
                <Text style={styles.alertButtonText}>Voir les offres</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#080808",
          tabBarInactiveTintColor: "#B0B3C1",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#FFFFFF",
            height: 80,
            paddingTop: 5,
            paddingBottom: Platform.OS === "android" ? 20 : 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          },
          tabBarLabelStyle: {
            display: "none",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={HomeIcon} label="" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="OurOffers"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={OffersIcon} label="" color={color} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Refresh subscription status when navigating to OurOffers
              refreshSubscriptionStatus();
            },
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={ProfileIcon} label="" color={color} focused={focused} />
            ),
          }}
        />

        {/* ✅ Rendez-vous Tab - Always show but handle click based on subscription status */}
        <Tabs.Screen
          name="RendezVous"
          options={{
            title: "Rendez-vous",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon
                icon="calendar-outline"
                label=""
                color={color}
                focused={focused}
                isIonicon
              />
            ),
          }}
          listeners={{
            tabPress: (e) => handleRendezVousPress(e),
          }}
        />

        <Tabs.Screen
          name="Abonnement"
          options={{
            title: "Abonnement",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={AbonnementIcon} label="" color={color} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Refresh subscription status when navigating to Abonnement
              refreshSubscriptionStatus();
            },
          }}
        />

        {/* ❌ Hide auto detected screens */}
        <Tabs.Screen name="GeneralConditions" options={{ href: null }} />
        <Tabs.Screen name="Menu" options={{ href: null }} />
        <Tabs.Screen name="NosOffres" options={{ href: null }} />
        <Tabs.Screen name="CeQueDisentClients" options={{ href: null }} />
        <Tabs.Screen name="AddComment" options={{ href: null }} />
      </Tabs>
    </ProtectedRoute>
  );
}

const styles = {
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
  alertButtonSecondaryText: {
    color: '#04D9E7'
  }
};