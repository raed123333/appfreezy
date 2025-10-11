import axios from "axios";
import { useRouter } from "expo-router"; // 👈 for navigation
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from '../context/AuthContext';
import { API } from "@/config";

const { width } = Dimensions.get("window");

const NosOffres: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [offres, setOffres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const getToken = () => user?.token || null;

  // 🔹 Fetch offers from API
  const fetchOffres = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${API}/offre`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffres(res.data);
    } catch (err) {
      console.error("Erreur API :", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffres();
  }, [user]);

  const renderCard = (offre: any, index: number) => {
    const isHovered = hoveredCard === index;

    const handlePressIn = () => setHoveredCard(index);
    const handlePressOut = () => setTimeout(() => setHoveredCard(null), 10);

    return (
      <Pressable
        key={offre._id || index}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={isHovered ? styles.firstcard : styles.card}
      >
        <Text style={isHovered ? styles.firstcardTitle : styles.cardTitle}>
          {offre.titre}
        </Text>
        <Text style={isHovered ? styles.firstcardText : styles.cardText}>
          {offre.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceNumber}>{offre.prix} CHF</Text>
          <Text style={styles.priceText}>/mois</Text>
        </View>
        <TouchableOpacity
          style={isHovered ? styles.firstcardButton : styles.cardButton}
          onPress={() =>
            router.push({
              pathname: "/OurOffers", // 👈 your big page
              params: { id: offre._id }, // pass offre id
            })
          }
        >
          <Text
            style={
              isHovered ? styles.firstcardButtonText : styles.cardButtonText
            }
          >
            Voir les détails
          </Text>
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <View style={styles.secondeContainer}>
      <Text style={{ color: "#080808", fontSize: 28, fontWeight: "bold" }}>
        Nos Offres
      </Text>

      {loading ? (
        <Text style={{ marginTop: 20 }}>Chargement...</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardsWrapper}
        >
          {offres.map((offre, idx) => renderCard(offre, idx))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  secondeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  cardsWrapper: {
    width: "100%",
    marginTop: 20,
    overflow: "visible",
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: width * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#080808",
    textAlign: "center",
  },
  cardText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  cardButton: {
    backgroundColor: "#04D9E7",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  cardButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  firstcard: {
    backgroundColor: "#080808",
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: width * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  firstcardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#04D9E7",
    textAlign: "center",
  },
  firstcardText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  firstcardButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  firstcardButtonText: {
    color: "#080808",
    fontWeight: "bold",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 20,
  },
  priceNumber: {
    fontSize: width * 0.09,
    fontWeight: "bold",
    color: "#04D9E7",
    marginRight: 5,
  },
  priceText: {
    fontSize: width * 0.035,
    fontWeight: "bold",
    color: "#04D9E7",
  },
});

export default NosOffres;