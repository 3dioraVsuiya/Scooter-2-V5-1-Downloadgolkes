import * as React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Header, Icon } from 'react-native-elements';
import { RNCamera } from 'react-native-camera';
import Permissions, { PERMISSIONS, RESULTS } from 'react-native-permissions';

interface QRProps {
    title: string;
    text: string;
    handleQRScanned: any;
    goBack: any;
}

interface QRState {
    cameraStatus: any;
}

export default class QRCodeScanner extends React.Component<QRProps, QRState> {
    state = {
        cameraStatus: RNCamera.Constants.CameraStatus.PENDING_AUTHORIZATION
    };

    async componentDidMount() {
        if (Platform.OS === 'android') {
            await Permissions.request(PERMISSIONS.ANDROID.CAMERA).then(
                (response: any) => {
                    this.setState({
                        cameraStatus: response === RESULTS.GRANTED
                    });
                }
            );
        }
    }

    handleCameraStatusChange = (event: any) => {
        this.setState({
            cameraStatus: event.cameraStatus
        });
    };

    render() {
        const { cameraStatus } = this.state;
        const { title, text, handleQRScanned, goBack } = this.props;

        if (cameraStatus === RNCamera.Constants.CameraStatus.PENDING_AUTHORIZATION) {
            return <Text>Requesting for camera permission</Text>;
        }

        if (cameraStatus === RNCamera.Constants.CameraStatus.NOT_AUTHORIZED) {
            return <Text>No access to camera</Text>;
        }

        return (
            <React.Fragment>
                <Header
                    leftComponent={
                        <Icon
                            name="arrow-back"
                            onPress={goBack}
                            color="#fff"
                            underlayColor="transparent"
                        />
                    }
                    centerComponent={{ text: title, style: { color: '#fff' } }}
                    backgroundColor="grey"
                />
                <View style={styles.content}>
                    <Text>{text}</Text>
                </View>
                <RNCamera
                    onBarCodeRead={(ret: any) => handleQRScanned(ret.data)}
                    style={{
                        flex: 1
                    }}
                    androidCameraPermissionOptions={{
                        title: 'Permission to use camera',
                        message: 'We need your permission to use your camera',
                        buttonPositive: 'OK',
                        buttonNegative: 'Cancel'
                    }}
                    captureAudio={false}
                    onStatusChange={this.handleCameraStatusChange}
                    barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
                />
            </React.Fragment>
        );
    }
}

const styles = StyleSheet.create({
    content: {
        alignItems: 'center',
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 10,
        paddingTop: 5
    }
});
