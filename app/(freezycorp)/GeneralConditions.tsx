import React from "react";
import { Link } from "expo-router";
import { Dimensions, Image, ImageBackground, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";

const { width, height } = Dimensions.get("window");

const GeneralConditions = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        <View style={styles.container}>
          <View style={styles.blueOverlay} />
          <ImageBackground
            style={styles.background}
            imageStyle={{ opacity: 0.6 }}
            resizeMode="cover"
          >
            <View style={styles.buttonRow}>

              <Image
                source={require("../../assets/images/iconBack.png")}              
                style={styles.search}
              />
              <Link href="../Menu" asChild>
              <Image
                source={require("../../assets/images/iconHome.png")}                          
                style={styles.search}
                />
                </Link>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.overlay}>
            <Text style={styles.title}>
              Conditions générales {'\n'}
            </Text>
            <Text style={styles.sectionText}>
              Préambule{'\n'}{'\n'}
              Les présentes conditions générales de ventes sont{'\n'}
              conclues d'une par la société « freezy global {'\n'}
              solutions» , entreprise immatriculée au registre du{'\n'}
              commerce de Genève sous le numéro{'\n'}
              CH660.2.698.021-9 ci-après dénommée « freezy{'\n'}
              global solutions » et d'autre part, par toute personne{'\n'}
              physique ou morale souhaitant procéder à un achat{'\n'}
              via le site interne freezyglobalsolutions.ch ou par tout{'\n'}
              autre support de commandes ( devis, bon de{'\n'}
              commande, téléphone, courriel, magasin...) {'\n'} {'\n'}

              <Text style={styles.secondeTitle}>
                Conditions d'application
              </Text>{'\n'}{'\n'}

              Nos conditions générales de vente et de livraison,{'\n'}
              reprises ci-dessous, de même que nos conditions{'\n'}
              particulières reprises dans nos offres et devis, sont{'\n'}
              réputées être admises par nos clients. Elles annulent {'\n'}
              et remplacent toutes autres conditions générales du {'\n'}
              client, sauf accord écrit du gérant ou d'un employé{'\n'}
              ayant reçu procuration à cet égard.{'\n'}{'\n'}

              Copyrights photos et illustrations : Tous droits du {'\n'}
              propriétaire des photos et illustrations des annonces {'\n'}
              de « freezy global solutions» apparaissant sur le site{'\n'} 
              freezy global solutions sont réservés. Toute{'\n'} 
              reproduction et toute utilisation des photos et{'\n'}
              illustrations du site autre que la consultation{'\n'} 
              individuelle et privée sont interdites, sauf autorisation.{'\n'}{'\n'}

              Copyrights contenus : Tous droits du propriétaire du{'\n'}
              contenu de « freezy global solutions » apparaissant {'\n'}
              sur le site freezy sont réservés. Toute reproduction et{'\n'}
              toute utilisation du contenu du site autre que la{'\n'} 
              consultation individuelle et privée sont interdites, sauf {'\n'}
              autorisation. Toute utilisation non expressément{'\n'}
              autorisée entraîne une violation des droits d'auteurs{'\n'} 
              et constitue une contrefaçon. freezy global solutions e {'\n'}
              réserve le droit d'engager des poursuites judiciaires{'\n'}
              pouvant engager la responsabilité civile et/ou pénale {'\n'}
              de l'auteur de ces violations.{'\n'}{'\n'}

              freezy global solutions reproduit sur les pages{'\n'}
              présentant les produits, les descriptions, photos et{'\n'}
              illustrations de ses partenaires. Fgs investi le{'\n'}
              maximum de ses moyens pour présenter une {'\n'}
              description conforme aux données des fournisseurs{'\n'}
              tant pour les descriptions que pour les photos et{'\n'}
              illustrations afin de donner à l'utilisateur une {'\n'}
              restitution des produits la plus conforme possible à{'\n'}
              celle communiquée par les partenaires. Les{'\n'}
              descriptions, photos et illustrations sont non{'\n'}
              contractuelles et ne sauraient engager la{'\n'} 
              responsabilité freezy global solutions et de ses{'\n'}
              partenaires.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Button at Bottom */}
      <View style={styles.fixedButtonContainer}>
        <View style={styles.fixedButtonRow}>
            <Image
                source={require("../../assets/images/Rectangle.png")}              
                style={styles.uiRectangle}
            />
            <Text style={{ flex: 1, marginLeft: 10, color: "#000" }}>Accepter les conditions générales</Text>
            <TouchableOpacity style={styles.secondeButton}>
              <Text style={styles.secondeButtonText}> > </Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, justifyContent: "center", alignItems: "center", height: height * 0.07, borderRadius: 100, overflow: "hidden" },
  overlay: { alignItems: "center" },
  blueOverlay: {
     ...StyleSheet.absoluteFillObject,
      backgroundColor: "#013743"
    },
  title: {
    fontSize: width * 0.09,
    fontWeight: "bold",
    color: "#013743", 
    textAlign: "center" 
},
  secondeTitle: { 
    fontSize: width * 0.05, 
    fontWeight: "bold", 
    color: "#000000", 
    textAlign: "center"
},
  sectionText: { 
    fontSize: width * 0.035, 
    marginBottom: 20, 
    textAlign: "center", 
    color: "#A5A5A5" 
},
  primaryButton: { 
    backgroundColor: "transparent", 
    padding: 15, 
    borderRadius: 8, 
    width: width * 0.45, 
    alignItems: "center" 
},
  MotText: { 
    color: "#8D8D8D", 
    fontSize: width * 0.04, 
    fontWeight: "bold", 
    marginBottom: 15 
},
  MotTextTwo: { 
    color: "#04D9E7", 
    fontSize: width * 0.04, 
    fontWeight: "bold", 
    marginBottom: 15 
},
  secondeButton: {
    backgroundColor: "#04D9E7", 
    padding: 7, 
    borderRadius: 8, 
    width: width * 0.12, 
    height: height * 0.04, 
    alignItems: "center", 
    justifyContent: "center" 
},
  secondeButtonText: {
    color: "#FFFFFF", 
    fontSize: width * 0.05, 
    fontWeight: "bold", 
    textAlign: "center" 
},
  inputContainer: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 30 },
  TextRow: { 
    flexDirection: "row", 
    justifyContent: "flex-start", 
    alignItems: "center", 
    marginTop: 20, 
    paddingHorizontal: 20 
},
  search: { 
    marginTop: 10, 
    width: 80, 
    height: 20, 
    resizeMode: "contain" 
},
  buttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 15, 
    width: "80%", 
    paddingHorizontal: 20 
},
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    width: width * 0.9,
    alignSelf: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fixedButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  uiRectangle: { 
    width: 30, 
    height: 20, 
    resizeMode: "contain" },
});

export default GeneralConditions;
