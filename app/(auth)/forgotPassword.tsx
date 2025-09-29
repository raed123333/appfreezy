import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from './../context/AuthContext';


const { width, height } = Dimensions.get("window");

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Verify Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { forgotPassword , verifyResetCode , resetPasswordWithCode } = useAuth();

    const handleSendCode = async () => {
        if (!email) {
            Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
            return;
        }

        setIsLoading(true);
        try {
            // This would call your backend to send the 6-digit code
            await forgotPassword(email);
            setStep(2);
            Alert.alert('Succès', 'Code de vérification envoyé! Vérifiez votre email.');
        } catch (error) {
            Alert.alert('Erreur', error.error || 'Échec de l\'envoi du code');
        } finally {
            setIsLoading(false);
        }
    };
 const handleVerifyCode = async () => {
        if (!code) {
            Alert.alert('Erreur', 'Veuillez entrer le code de vérification');
            return;
        }

        if (code.length !== 6) {
            Alert.alert('Erreur', 'Le code doit contenir 6 chiffres');
            return;
        }

        setIsLoading(true);
        try {
            await verifyResetCode(email, code); // FIXED: Call the actual function
            setStep(3);
        } catch (error) {
            Alert.alert('Erreur', error.error || 'Code invalide ou expiré');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleResetPassword = async () => { // CHANGED to async
        if (!newPassword || !confirmPassword) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setIsLoading(true);
        console.log(email,code,newPassword);
        try {
            await resetPasswordWithCode(email, code, newPassword); // CALL THE ACTUAL FUNCTION
            Alert.alert(
                'Succès',
                'Mot de passe réinitialisé avec succès!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Erreur', error.error || 'Échec de la réinitialisation du mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    
    

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Étape 1/3</Text>
            <Text style={styles.instruction}>
                Entrez votre adresse email et nous vous enverrons un code de vérification à 6 chiffres.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor="#B0B3C1"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <TouchableOpacity
                style={[styles.button, isLoading && styles.disabledButton]}
                onPress={handleSendCode}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? 'Envoi...' : 'Envoyer le code'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Étape 2/3</Text>
            <Text style={styles.instruction}>
                Entrez le code à 6 chiffres envoyé à {email}
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Code à 6 chiffres"
                placeholderTextColor="#B0B3C1"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
            />

            <View style={styles.rowButtons}>
                <TouchableOpacity
                    style={[styles.secondaryButton, styles.halfButton]}
                    onPress={() => setStep(1)}
                >
                    <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.halfButton, isLoading && styles.disabledButton]}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Vérification...' : 'Vérifier'}
                    </Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resendButton}>
                <Text style={styles.resendText}>Renvoyer le code</Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Étape 3/3</Text>
            <Text style={styles.instruction}>
                Créez votre nouveau mot de passe
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor="#B0B3C1"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
            />

            <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#B0B3C1"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
            />

            <View style={styles.rowButtons}>
                <TouchableOpacity
                    style={[styles.secondaryButton, styles.halfButton]}
                    onPress={() => setStep(2)}
                >
                    <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.halfButton, isLoading && styles.disabledButton]}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>
                        {isLoading ? 'Envoi...' : 'Réinitialiser'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Mot de passe oublié</Text>
                </View>

                <View style={styles.formContainer}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Retour à la connexion</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardAvoid: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    title: {
        fontSize: width * 0.07,
        fontWeight: 'bold',
        color: '#013743',
        textAlign: 'center',
        marginBottom: 10,
    },
    formContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: width * 0.045,
        color: '#04D9E7',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    instruction: {
        fontSize: width * 0.04,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    input: {
        height: 50,
        width: '100%',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingLeft: 15,
        color: '#23233C',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: width * 0.04,
    },
    button: {
        backgroundColor: '#04D9E7',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    halfButton: {
        width: '48%',
    },
    rowButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    disabledButton: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: width * 0.045,
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: width * 0.045,
        fontWeight: 'bold',
    },
    resendButton: {
        padding: 10,
        marginBottom: 20,
    },
    resendText: {
        color: '#04D9E7',
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 10,
        marginTop: 20,
    },
    backButtonText: {
        color: '#04D9E7',
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
});

export default ForgotPassword;