import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from '../context/AuthContext';
import { API } from "@/config";

const { width } = Dimensions.get("window");

interface Comment {
  idCom: number;
  nomUti: string;
  prenomUti: string;
  commentaire: string;
  utilisateurId: number;
  Utilisateur?: {
    idU: number;
    nom: string;
    prenom: string;
    image: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

const CeQueDisentClients: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const getToken = () => user?.token || null;

  useEffect(() => {
    fetchComments();
  }, [user]);

  const fetchComments = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API}/comment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
      
    }
  };

 

  // Function to get the user's profile image
  const getUserProfileImage = (comment: Comment) => {
    if (comment.Utilisateur && comment.Utilisateur.image) {
      const imagePath = comment.Utilisateur.image;
      if (imagePath.startsWith('http')) return { uri: imagePath };
      if (imagePath.startsWith('data:image')) return { uri: imagePath };
      return { uri: `${API}/uploads/${imagePath}` };
    }
    return require("../../assets/images/profileImg.png");
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / (width * 0.7 + 16));
    setActiveIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.thirdContainer}>
        <Text style={styles.thirdTitle}>
          Ce que disent {"\n"} nos clients
        </Text>
        <Text style={styles.loadingText}>Chargement des commentaires...</Text>
      </View>
    );
  }

  return (
    <View style={styles.thirdContainer}>
      <Text style={styles.thirdTitle}>
        Ce que disent {"\n"} nos clients
      </Text>

      {comments.length === 0 ? (
        <ScrollView>
          <Text style={styles.noCommentsText}>Aucun commentaire pour le moment</Text>
        </ScrollView>
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={[styles.cardsWrapper, { overflow: "visible" }]}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {comments.map((comment, i) => (
              <View key={comment.idCom} style={styles.clientCard}>
                <Text style={styles.clientName}>
                  {comment.Utilisateur ? `${comment.Utilisateur.nom} ${comment.Utilisateur.prenom}` : `${comment.nomUti} ${comment.prenomUti}`}
                </Text>
                <Text style={styles.clientText}>
                  {comment.commentaire}
                </Text>
                <Image
                  source={getUserProfileImage(comment)}
                  style={styles.clientImg}
                  onError={(e) => {
                    console.log("Error loading profile image:", e.nativeEvent.error);
                  }}
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {comments.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, activeIndex === index && styles.activeDot]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  thirdContainer: {
    backgroundColor: "#013743",
    padding: 20,
    marginTop: 30,
    paddingBottom: 40,
  },
  thirdTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#04D9E7",
    marginBottom: 20,
    textAlign: "center",
  },
  clientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginRight: 16,
    width: width * 0.7,
    overflow: "visible",
    marginBottom: 20,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#04D9E7",
    marginBottom: 8,
    textAlign: "left",
  },
  clientText: {
    fontSize: 14,
    color: "#013743",
    textAlign: "left",
    marginBottom: 30,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF50",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
  },
  clientImg: {
    width: 60,
    height: 60,
    position: "absolute",
    bottom: -30,
    left: 20,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#fff",
  },
  cardsWrapper: {
    width: "100%",
    marginTop: 20,
    overflow: "visible",
    marginBottom: 10,
  },
  loadingText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
  },
  noCommentsText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    marginTop: 20,
    fontStyle: "italic",
  },
});

export default CeQueDisentClients;