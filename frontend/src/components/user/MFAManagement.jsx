import React, { useState, useEffect } from 'react';
import { 
  Card, Steps, Button, Form, Input, Radio, 
  Alert, Typography, Space, Divider, QRCode,
  Modal, message, Tag, List, Tooltip
} from 'antd';
import { 
  MobileOutlined, 
  MailOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CopyOutlined,
  KeyOutlined,
  ShieldCheckOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const MFAManagement = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('none');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // const response = await axios.get('/api/auth/mfa/status');
      // setMfaEnabled(response.data.enabled);
      // setMfaMethod(response.data.method);
    } catch (error) {
      console.error('Fetch MFA status error:', error);
    }
  };

  const handleMethodSelect = (method) => {
    setMfaMethod(method);
    if (method === 'totp') {
      setCurrentStep(1);
      generateTOTPSetup();
    } else if (method === 'sms') {
      setCurrentStep(2);
    } else if (method === 'email') {
      setCurrentStep(3);
    }
  };

  const generateTOTPSetup = async () => {
    setLoading(true);
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // const response = await axios.post('/api/auth/mfa/totp/setup');
      // setQrCode(response.data.qr_code);
      // setSecretKey(response.data.secret_key);
      
      // Mock data for UI demonstration
      setQrCode('otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example');
      setSecretKey('JBSWY3DPEHPK3PXP');
    } catch (error) {
      console.error('Generate TOTP setup error:', error);
      message.error('Failed to generate TOTP setup');
    } finally {
      setLoading(false);
    }
  };

  const handleTOTPVerify = async (values) => {
    setLoading(true);
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // await axios.post('/api/auth/mfa/totp/verify', values);
      
      // Generate backup codes after successful verification
      generateBackupCodes();
      
      message.success('TOTP enabled successfully');
      setMfaEnabled(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('TOTP verify error:', error);
      message.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // const response = await axios.post('/api/auth/mfa/backup-codes/generate');
      // setBackupCodes(response.data.codes);
      
      // Mock backup codes
      setBackupCodes([
        'ABCD-1234-EFGH-5678',
        'IJKL-9012-MNOP-3456',
        'QRST-7890-UVWX-1234',
        'YZAB-4567-CDEF-8901',
        'GHIJ-2345-KLMN-6789'
      ]);
    } catch (error) {
      console.error('Generate backup codes error:', error);
      message.error('Failed to generate backup codes');
    }
  };

  const handleSMSVerify = async (values) => {
    setLoading(true);
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // await axios.post('/api/auth/mfa/sms/verify', values);
      
      message.success('SMS MFA enabled successfully');
      setMfaEnabled(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('SMS verify error:', error);
      message.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerify = async (values) => {
    setLoading(true);
    try {
      // Placeholder - will be implemented when MFA backend is ready
      // await axios.post('/api/auth/mfa/email/verify', values);
      
      message.success('Email MFA enabled successfully');
      setMfaEnabled(true);
      setCurrentStep(4);
    } catch (error) {
      console.error('Email verify error:', error);
      message.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    Modal.confirm({
      title: 'Disable Multi-Factor Authentication',
      content: 'Are you sure you want to disable MFA? This will make your account less secure.',
      okText: 'Disable',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          // Placeholder - will be implemented when MFA backend is ready
          // await axios.post('/api/auth/mfa/disable');
          
          message.success('MFA disabled successfully');
          setMfaEnabled(false);
          setMfaMethod('none');
          setCurrentStep(0);
        } catch (error) {
          console.error('Disable MFA error:', error);
          message.error('Failed to disable MFA');
        }
      }
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Alert
              message="Multi-Factor Authentication Not Enabled"
              description="Add an extra layer of security to your account by enabling MFA. Choose your preferred method below."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Title level={4}>Choose MFA Method</Title>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <Card
                hoverable
                onClick={() => handleMethodSelect('totp')}
                style={{ cursor: 'pointer', borderColor: mfaMethod === 'totp' ? '#1890ff' : '#d9d9d9' }}
              >
                <Space>
                  <MobileOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>Authenticator App</Title>
                    <Text type="secondary">Use Google Authenticator, Authy, or similar app</Text>
                  </div>
                </Space>
              </Card>
              
              <Card
                hoverable
                onClick={() => handleMethodSelect('sms')}
                style={{ cursor: 'pointer', borderColor: mfaMethod === 'sms' ? '#1890ff' : '#d9d9d9' }}
              >
                <Space>
                  <MobileOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>SMS</Title>
                    <Text type="secondary">Receive verification codes via text message</Text>
                  </div>
                </Space>
              </Card>
              
              <Card
                hoverable
                onClick={() => handleMethodSelect('email')}
                style={{ cursor: 'pointer', borderColor: mfaMethod === 'email' ? '#1890ff' : '#d9d9d9' }}
              >
                <Space>
                  <MailOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>Email</Title>
                    <Text type="secondary">Receive verification codes via email</Text>
                  </div>
                </Space>
              </Card>
            </Space>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Set Up Authenticator App</Title>
            <Paragraph>
              Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
            </Paragraph>
            
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <QRCode value={qrCode} size={200} />
            </div>
            
            <Alert
              message="Or enter this code manually"
              description={
                <Space>
                  <Text code style={{ fontSize: 16 }}>{secretKey}</Text>
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={() => copyToClipboard(secretKey)}
                  />
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Form form={form} onFinish={handleTOTPVerify}>
              <Form.Item
                name="code"
                label="Enter Verification Code"
                rules={[{ required: true, message: 'Please enter the verification code' }]}
              >
                <Input.OTP length={6} placeholder="Enter 6-digit code" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Verify and Enable
                  </Button>
                  <Button onClick={() => setCurrentStep(0)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Set Up SMS Verification</Title>
            <Paragraph>
              We'll send a verification code to your registered phone number.
            </Paragraph>
            
            <Form form={form} onFinish={handleSMSVerify}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter your phone number' }]}
              >
                <Input placeholder="+1 (555) 000-0000" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={() => message.success('SMS sent!')}>
                  Send Verification Code
                </Button>
              </Form.Item>
              <Form.Item
                name="code"
                label="Enter Verification Code"
                rules={[{ required: true, message: 'Please enter the verification code' }]}
              >
                <Input.OTP length={6} placeholder="Enter 6-digit code" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Verify and Enable
                  </Button>
                  <Button onClick={() => setCurrentStep(0)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        );

      case 3:
        return (
          <div>
            <Title level={4}>Set Up Email Verification</Title>
            <Paragraph>
              We'll send a verification code to your registered email address.
            </Paragraph>
            
            <Form form={form} onFinish={handleEmailVerify}>
              <Form.Item>
                <Button type="primary" onClick={() => message.success('Email sent!')}>
                  Send Verification Code
                </Button>
              </Form.Item>
              <Form.Item
                name="code"
                label="Enter Verification Code"
                rules={[{ required: true, message: 'Please enter the verification code' }]}
              >
                <Input.OTP length={6} placeholder="Enter 6-digit code" />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Verify and Enable
                  </Button>
                  <Button onClick={() => setCurrentStep(0)}>
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        );

      case 4:
        return (
          <div>
            <Alert
              message="MFA Enabled Successfully"
              description="Your account is now protected with multi-factor authentication."
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Card title="Backup Codes" style={{ marginBottom: 24 }}>
              <Paragraph>
                Save these backup codes in a safe place. You can use them to access your account if you lose your device.
              </Paragraph>
              <List
                dataSource={backupCodes}
                renderItem={(code) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(code)}
                      />
                    ]}
                  >
                    <Text code style={{ fontSize: 14 }}>{code}</Text>
                  </List.Item>
                )}
              />
              <Button type="link" onClick={generateBackupCodes}>
                Generate New Backup Codes
              </Button>
            </Card>
            
            <Space>
              <Button type="primary" onClick={() => setCurrentStep(0)}>
                Done
              </Button>
              <Button danger onClick={handleDisableMFA}>
                Disable MFA
              </Button>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <SafetyOutlined /> Multi-Factor Authentication
      </Title>

      <Card>
        {mfaEnabled ? (
          <div>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Alert
                message="MFA is Enabled"
                description={`Your account is protected using ${mfaMethod === 'totp' ? 'Authenticator App' : mfaMethod === 'sms' ? 'SMS' : 'Email'}`}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
              
              <Card title="Backup Codes">
                <List
                  dataSource={backupCodes}
                  renderItem={(code) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(code)}
                        />
                      ]}
                    >
                      <Text code>{code}</Text>
                    </List.Item>
                  )}
                />
                <Button type="link" onClick={generateBackupCodes}>
                  Generate New Backup Codes
                </Button>
              </Card>
              
              <Button danger onClick={handleDisableMFA}>
                Disable MFA
              </Button>
            </Space>
          </div>
        ) : (
          renderStepContent()
        )}
      </Card>
    </div>
  );
};

export default MFAManagement;
