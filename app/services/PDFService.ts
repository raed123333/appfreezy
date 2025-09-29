import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

// Define the PaymentData interface based on your model
interface PaymentData {
  idpay: number;
  userName: string;
  userLastName: string;
  compagnyName: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  offreId: number | null;
  paymentIntentId: string;
  dateDebut: string | Date;
  dateFin: string | Date;
  createdAt: string | Date;
}

class PDFService {
  static async generatePaymentPDF(paymentData: PaymentData): Promise<string> {
    try {
      // Create HTML content for the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 40px;
                    color: #333;
                }
                .header { 
                    text-align: center; 
                    color: #013743;
                    font-size: 24px;
                    margin-bottom: 30px;
                }
                .section-title {
                    color: #04D9E7;
                    font-size: 16px;
                    margin: 20px 0 10px 0;
                    border-bottom: 1px solid #04D9E7;
                    padding-bottom: 5px;
                }
                .detail-row {
                    margin: 8px 0;
                    display: flex;
                }
                .detail-label {
                    font-weight: bold;
                    width: 150px;
                }
                .footer {
                    text-align: center;
                    color: #888;
                    margin-top: 40px;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">FACTURE</div>
            
            <div>
                <strong>Entreprise:</strong> ${paymentData.compagnyName || 'N/A'}<br>
                <strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}
            </div>
            
            <div class="section-title">DÉTAILS DE LA TRANSACTION</div>
            
            <div class="detail-row">
                <span class="detail-label">ID Transaction:</span>
                <span>${paymentData.idpay}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Client:</span>
                <span>${paymentData.userName} ${paymentData.userLastName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Entreprise:</span>
                <span>${paymentData.compagnyName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Montant:</span>
                <span>${paymentData.amount} ${paymentData.currency}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Statut:</span>
                <span>${paymentData.status}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span>${paymentData.description}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Offre:</span>
                <span>${this.getOffreName(paymentData.offreId)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date de début:</span>
                <span>${new Date(paymentData.dateDebut).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date de fin:</span>
                <span>${new Date(paymentData.dateFin).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">ID Paiement Stripe:</span>
                <span>${paymentData.paymentIntentId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date de transaction:</span>
                <span>${new Date(paymentData.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            
            <div class="footer">Merci pour votre confiance!</div>
        </body>
        </html>
      `;

      // Save HTML to file
      const htmlPath = `${FileSystem.cacheDirectory}transaction_${paymentData.idpay}.html`;
      await FileSystem.writeAsStringAsync(htmlPath, htmlContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      return htmlPath;
    } catch (error) {
      console.error('Error generating PDF content:', error);
      throw error;
    }
  }
  
  static getOffreName(offreId: number | null): string {
    const offreNames: { [key: number]: string } = {
      1: "Mensuelle",
      3: "Trimestrielle", 
      6: "Semestrielle",
      12: "Annuelle"
    };
    return offreId ? (offreNames[offreId] || "Mensuelle") : "Mensuelle";
  }
  
  static async downloadAndSharePDF(paymentData: PaymentData): Promise<void> {
    try {
      Alert.alert(
        "Téléchargement",
        "Génération du document en cours...",
        [{ text: "OK" }]
      );
      
      const filePath = await this.generatePaymentPDF(paymentData);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: `Transaction_${paymentData.idpay}`,
          UTI: 'public.html'
        });
      } else {
        Alert.alert(
          "Succès",
          `Document généré: ${filePath}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      Alert.alert(
        "Erreur",
        "Impossible de générer le document",
        [{ text: "OK" }]
      );
    }
  }
}

export default PDFService;