import { API } from "@/config";
import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "./../context/AuthContext";

const { width, height } = Dimensions.get("window");

const AddComment = () => {
  const { logout, user } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    type: '', 
    onConfirm: null as (() => void) | null,
    showCancel: false 
  });

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

  const handleLogout = () => {
    showCustomAlertMessage(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      'warning',
      () => logout(),
      true
    );
  };

  // Function to get user's name information
  const getUserNameInfo = () => {
    if (!user) return { nom: "Utilisateur", prenom: "Anonyme" };
    
    // Check nested structure first (from your Menu component)
    if (user.utilisateur && user.utilisateur.nom && user.utilisateur.prenom) {
      return {
        nom: user.utilisateur.nom,
        prenom: user.utilisateur.prenom,
        id: user.utilisateur.idU || user.utilisateur.id
      };
    }
    // Check root level structure
    else if (user.nom && user.prenom) {
      return {
        nom: user.nom,
        prenom: user.prenom,
        id: user.idU || user.id
      };
    }
    // Check for other possible structures
    else if (user.nomEntreprise) {
      return {
        nom: user.nomEntreprise,
        prenom: "",
        id: user.idU || user.id
      };
    }
    // Default fallback
    else {
      return {
        nom: "Utilisateur",
        prenom: "Anonyme",
        id: user.idU || user.id || "1"
      };
    }
  };

  // Fetch user's comments
  const fetchUserComments = async () => {
    try {
      const userInfo = getUserNameInfo();
      const response = await fetch(`${API}/comment/user/${userInfo.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserComments(data);
      } else {
        console.error("Failed to fetch user comments");
      }
    } catch (error) {
      console.error("Error fetching user comments:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserComments();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserComments();
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      showCustomAlertMessage("Erreur", "Veuillez écrire un commentaire");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the correct user name information
      const { nom, prenom, id } = getUserNameInfo();
      
      const response = await fetch(`${API}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          nomUti: nom,
          prenomUti: prenom,
          commentaire: comment.trim(),
          utilisateurId: id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showCustomAlertMessage("Succès", "Votre commentaire a été envoyé avec succès! ✅");
        setComment("");
        // Refresh the comments list
        fetchUserComments();
      } else {
        showCustomAlertMessage("Erreur", data.error || "Une erreur s'est produite");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du commentaire:", error);
      showCustomAlertMessage("Erreur", "Impossible d'envoyer le commentaire. Vérifiez votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete comment function
  const handleDeleteComment = async (commentId) => {
    showCustomAlertMessage(
      "Supprimer le commentaire",
      "Êtes-vous sûr de vouloir supprimer ce commentaire ?",
      'warning',
      async () => {
        try {
          const response = await fetch(`${API}/comment/${commentId}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${user?.token}`,
            },
          });

          if (response.ok) {
            showCustomAlertMessage("Succès", "Commentaire supprimé avec succès! ✅");
            // Refresh the comments list
            fetchUserComments();
          } else {
            showCustomAlertMessage("Erreur", "Impossible de supprimer le commentaire");
          }
        } catch (error) {
          console.error("Erreur lors de la suppression du commentaire:", error);
          showCustomAlertMessage("Erreur", "Impossible de supprimer le commentaire. Vérifiez votre connexion.");
        }
      },
      true
    );
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user info for display
  const userInfo = getUserNameInfo();

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

      {/* Fixed top container */}
      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.buttonRow}>
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

      {/* Scrollable content */}
      <ScrollView 
        contentContainerStyle={{ paddingTop: height * 0.12 + 10, paddingBottom: 20 }}
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
            <Text style={styles.title}>Créér un commentaire</Text>
            <Text style={styles.sectionText}>
              Laissez-nous votre avis sur nos services
            </Text>
          </View>

          {/* Comment Card */}
          <View style={styles.commentCard}>
            <Text style={styles.commentTitle}>Votre commentaire</Text>
            
            {/* Comment Input Area */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={6}
                placeholder="Écrivez votre commentaire ici..."
                placeholderTextColor="#A5A5A5"
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
            </View>
            
            {/* User Info Display */}
            {user && (
              <Text style={styles.userInfo}>
                Posté en tant que: {userInfo.prenom} {userInfo.nom}
              </Text>
            )}
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, (!comment || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!comment || isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Envoi en cours...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Ajouter commentaire</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* User's Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>Vos commentaires précédents</Text>
            
            {isLoading ? (
              <Text style={styles.loadingText}>Chargement de vos commentaires...</Text>
            ) : userComments.length > 0 ? (
              userComments.map((commentItem) => (
                <View key={commentItem.idCom} style={styles.commentItem}>
                  <View style={styles.commentContent}>
                    <Text style={styles.commentText}>{commentItem.commentaire}</Text>
                    <Text style={styles.commentDate}>
                      {formatDate(commentItem.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteComment(commentItem.idCom)}
                  >
                    <Image
                      source={require("../../assets/images/iconDelete.png")}
                      style={styles.deleteIcon}
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>Vous n'avez pas encore de commentaires</Text>
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
    height: height * 0.12,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: "hidden",
  },
  overlay: {
    alignItems: "center",
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#080808",
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#080808",
    textAlign: "center",
  },
  sectionText: {
    fontSize: width * 0.035,
    marginBottom: 20,
    textAlign: "center",
    color: "#A5A5A5",
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingBottom: 30,
  },
  icon: {
    marginTop: 25,
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    width: "100%",
    paddingHorizontal: 20,
  },
  commentCard: {
    width: width * 0.9,
    backgroundColor: "#F4F5FA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
    marginTop: 20,
  },
  commentTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#080808",
    marginBottom: 15,
    textAlign: "center",
  },
  commentInputContainer: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 15,
  },
  commentInput: {
    width: "100%",
    padding: 15,
    fontSize: width * 0.04,
    color: "#080808",
    minHeight: 150,
  },
  userInfo: {
    fontSize: width * 0.035,
    color: "#828282",
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#04D9E7",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#B2E5E9",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  commentsSection: {
    width: width * 0.9,
    marginTop: 30,
    padding: 20,
    backgroundColor: "#F4F5FA",
    borderRadius: 12,
  },
  commentsTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#080808",
    marginBottom: 15,
    textAlign: "center",
  },
  commentItem: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  commentContent: {
    flex: 1,
    marginRight: 10,
  },
  commentText: {
    fontSize: width * 0.04,
    color: "#080808",
    marginBottom: 8,
  },
  commentDate: {
    fontSize: width * 0.03,
    color: "#828282",
    textAlign: "left",
  },
  deleteButton: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteIcon: {
    width: 20,
    height: 20,
    tintColor: "#FF3B30",
  },
  loadingText: {
    textAlign: "center",
    color: "#828282",
    fontSize: width * 0.04,
    marginVertical: 20,
  },
  noCommentsText: {
    textAlign: "center",
    color: "#828282",
    fontSize: width * 0.04,
    marginVertical: 20,
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

export default AddComment;