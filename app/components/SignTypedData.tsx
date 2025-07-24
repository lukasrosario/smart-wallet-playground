'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSignTypedData, useAccount, useChainId } from 'wagmi';
import { serialize } from '@wagmi/core';
import { useWallet } from '../context/WagmiContextProvider';
import { useHydration } from '../hooks/useHydration';
import { useConfig } from '../context/ConfigContext';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';
import { PillButton } from './ui/PillButton';
import { Input } from './ui/Input';
import { ConnectWalletPrompt } from './ui/ConnectWalletPrompt';

const EIP712_TYPES = ['string', 'bytes', 'bytes32', 'uint256', 'uint8', 'int256', 'bool', 'address'] as const;

// Helper function to generate cryptographically secure random nonce
const generateRandomNonce = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return '0x' + Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

type EIP712Type = (typeof EIP712_TYPES)[number];

type TypeField = {
  name: string;
  type: EIP712Type | string;
};

type CustomType = {
  name: string;
  fields: TypeField[];
};

type DomainConfig = {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: `0x${string}`;
};

type MessageField = {
  key: string;
  value: string | number;
  type: EIP712Type | string;
};

// EIP-3009 and Spend Permissions shortcuts
const SHORTCUT_TEMPLATES = {
  'EIP-3009 TransferWithAuthorization': {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      TransferWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'TransferWithAuthorization',
    messageFields: [
      { key: 'from', value: '0x0000000000000000000000000000000000000000', type: 'address' },
      { key: 'to', value: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', type: 'address' },
      { key: 'value', value: '1000000', type: 'uint256' },
      { key: 'validAfter', value: '0', type: 'uint256' },
      { key: 'validBefore', value: Math.floor(Date.now() / 1000) + 3600, type: 'uint256' }, // Valid for 1 hour
      {
        key: 'nonce',
        value: generateRandomNonce(),
        type: 'bytes32',
      },
    ],
  },
  'EIP-3009 ReceiveWithAuthorization': {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ReceiveWithAuthorization: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'validAfter', type: 'uint256' },
        { name: 'validBefore', type: 'uint256' },
        { name: 'nonce', type: 'bytes32' },
      ],
    },
    primaryType: 'ReceiveWithAuthorization',
    messageFields: [
      { key: 'from', value: '0x0000000000000000000000000000000000000000', type: 'address' },
      { key: 'to', value: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', type: 'address' },
      { key: 'value', value: '1000000', type: 'uint256' },
      { key: 'validAfter', value: '0', type: 'uint256' },
      { key: 'validBefore', value: Math.floor(Date.now() / 1000) + 3600, type: 'uint256' }, // Valid for 1 hour
      {
        key: 'nonce',
        value: generateRandomNonce(),
        type: 'bytes32',
      },
    ],
  },

  'Spend Permissions': {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      SpendPermission: [
        { name: 'account', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'allowance', type: 'uint160' },
        { name: 'period', type: 'uint48' },
        { name: 'start', type: 'uint48' },
        { name: 'end', type: 'uint48' },
        { name: 'salt', type: 'uint256' },
        { name: 'extraData', type: 'bytes' },
      ],
    },
    primaryType: 'SpendPermission',
    messageFields: [
      { key: 'account', value: '0x0000000000000000000000000000000000000000', type: 'address' },
      { key: 'spender', value: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', type: 'address' },
      { key: 'token', value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', type: 'address' }, // USDC on Base
      { key: 'allowance', value: '1000000', type: 'uint160' },
      { key: 'period', value: 86400, type: 'uint48' }, // (1 day in seconds)
      { key: 'start', value: Math.floor(Date.now() / 1000), type: 'uint48' },
      { key: 'end', value: Math.floor(Date.now() / 1000) + 86400 * 30, type: 'uint48' }, // (30 days from now)
      { key: 'salt', value: Math.floor(Math.random() * 1000000).toString(), type: 'uint256' },
      { key: 'extraData', value: '0x', type: 'bytes' },
    ],
  },
};

export function SignTypedData() {
  const { addLog } = useWallet();
  const { isConnected, address: connectedAddress } = useAccount();
  const isHydrated = useHydration();
  const { signTypedData, data: signature, error, isPending } = useSignTypedData();
  const chainId = useChainId();
  const { appName } = useConfig();

  const displayIsConnected = isHydrated && isConnected;

  // State for custom types
  const [customTypes, setCustomTypes] = useState<CustomType[]>([
    {
      name: 'Person',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
    },
    {
      name: 'Mail',
      fields: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
  ]);

  const [domain, setDomain] = useState<DomainConfig>({
    name: appName,
    version: '2', // ERC-3009 example uses version "2" for USD Coin
    chainId: chainId,
    verifyingContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract address from ERC-3009 spec
  });

  // State for message construction
  const [primaryType, setPrimaryType] = useState('Mail');
  const [messageFields, setMessageFields] = useState<MessageField[]>([]);

  const [mode, setMode] = useState<'builder' | 'json'>('builder');
  const [jsonInput, setJsonInput] = useState('');
  const [showAsString, setShowAsString] = useState(false);
  const [showDomainConfig, setShowDomainConfig] = useState(false);
  const [showMessageConfig, setShowMessageConfig] = useState(false);

  // Sync domain with context changes (only if not using template-specific domain)
  useEffect(() => {
    setDomain((prev) => {
      // Don't override template-specific domains
      if (prev.name === 'USD Coin' || prev.name === 'Spend Permission Manager') {
        return {
          ...prev,
          chainId: chainId, // Still sync chainId
        };
      }

      // Sync with SDK for default/custom domains
      return {
        ...prev,
        name: appName,
        chainId: chainId,
      };
    });
  }, [appName, chainId]);

  // Convert custom types to EIP-712 format
  const eip712Types = useMemo(() => {
    const types: Record<string, Array<{ name: string; type: string }>> = {};
    customTypes.forEach((customType) => {
      types[customType.name] = customType.fields.map((field) => ({
        name: field.name,
        type: field.type,
      }));
    });
    return types;
  }, [customTypes]);

  // Convert message fields to nested object
  const messageObject = useMemo(() => {
    const message: Record<string, unknown> = {};
    messageFields.forEach((field) => {
      const keys = field.key.split('.');
      let current: Record<string, unknown> = message;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      const finalKey = keys[keys.length - 1];

      current[finalKey] = field.value;
    });
    return message;
  }, [messageFields]);

  // Load shortcut template
  const loadShortcut = useCallback(
    (templateName: keyof typeof SHORTCUT_TEMPLATES) => {
      const template = SHORTCUT_TEMPLATES[templateName];

      // Convert types to CustomType format
      const newTypes: CustomType[] = Object.entries(template.types).map(([name, fields]) => ({
        name,
        fields: fields as TypeField[],
      }));

      // Smart defaults: auto-fill fields with connected address
      const messageFields = template.messageFields.map((field) => {
        if (templateName.startsWith('EIP-3009') && field.key === 'from' && connectedAddress) {
          return {
            ...field,
            value: connectedAddress,
          };
        }
        if (templateName === 'Spend Permissions' && field.key === 'account' && connectedAddress) {
          return {
            ...field,
            value: connectedAddress,
          };
        }
        return {
          ...field,
          value: field.value, // Keep original value format for EIP-712
        };
      });

      // Set domain based on template type
      if (templateName === 'Spend Permissions') {
        setDomain({
          name: 'Spend Permission Manager',
          version: '1',
          chainId: chainId,
          verifyingContract: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad', // Placeholder contract
        });
      } else if (templateName.startsWith('EIP-3009')) {
        setDomain({
          name: 'USD Coin',
          version: '2',
          chainId: chainId,
          verifyingContract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract
        });
      }

      setCustomTypes(newTypes);
      setPrimaryType(template.primaryType);
      setMessageFields(messageFields);
    },
    [connectedAddress, chainId],
  );

  const addCustomType = useCallback(() => {
    setCustomTypes((prev) => [
      ...prev,
      {
        name: `CustomType${prev.length + 1}`,
        fields: [{ name: 'value', type: 'string' }],
      },
    ]);
  }, []);

  const removeCustomType = useCallback((index: number) => {
    setCustomTypes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addFieldToType = useCallback((typeIndex: number) => {
    setCustomTypes((prev) =>
      prev.map((type, i) =>
        i === typeIndex ? { ...type, fields: [...type.fields, { name: 'newField', type: 'string' }] } : type,
      ),
    );
  }, []);

  const removeFieldFromType = useCallback((typeIndex: number, fieldIndex: number) => {
    setCustomTypes((prev) =>
      prev.map((type, i) =>
        i === typeIndex ? { ...type, fields: type.fields.filter((_, j) => j !== fieldIndex) } : type,
      ),
    );
  }, []);

  const updateCustomType = useCallback((typeIndex: number, updates: Partial<CustomType>) => {
    setCustomTypes((prev) => prev.map((type, i) => (i === typeIndex ? { ...type, ...updates } : type)));
  }, []);

  const updateTypeField = useCallback((typeIndex: number, fieldIndex: number, updates: Partial<TypeField>) => {
    setCustomTypes((prev) =>
      prev.map((type, i) =>
        i === typeIndex
          ? {
              ...type,
              fields: type.fields.map((field, j) => (j === fieldIndex ? { ...field, ...updates } : field)),
            }
          : type,
      ),
    );
  }, []);

  const addMessageField = useCallback(() => {
    setMessageFields((prev) => [...prev, { key: 'newField', value: '', type: 'string' }]);
  }, []);

  const removeMessageField = useCallback((index: number) => {
    setMessageFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateMessageField = useCallback((index: number, updates: Partial<MessageField>) => {
    setMessageFields((prev) => prev.map((field, i) => (i === index ? { ...field, ...updates } : field)));
  }, []);

  const handleBuilderSubmit = useCallback(() => {
    if (!displayIsConnected) {
      addLog({
        type: 'error',
        data: 'Wallet not connected',
      });
      return;
    }

    const typedData = {
      domain,
      types: eip712Types,
      primaryType,
      message: messageObject,
    };

    if (showAsString) {
      // Sign the JSON stringified version
      signTypedData({
        domain: { name: 'String Message' },
        types: {
          Message: [{ name: 'data', type: 'string' }],
        },
        primaryType: 'Message',
        message: { data: JSON.stringify(typedData) },
      });
    } else {
      // Sign the structured data
      signTypedData(typedData);
    }
  }, [signTypedData, domain, eip712Types, primaryType, messageObject, displayIsConnected, addLog, showAsString]);

  // Generate JSON preview
  const jsonPreview = useMemo(() => {
    const typedData = {
      domain,
      types: eip712Types,
      primaryType,
      message: messageObject,
    };

    if (showAsString) {
      return serialize(
        {
          domain: { name: 'String Message' },
          types: {
            Message: [{ name: 'data', type: 'string' }],
          },
          primaryType: 'Message',
          message: { data: serialize(typedData) },
        },
        null,
        2,
      );
    }

    return serialize(typedData, null, 2);
  }, [domain, eip712Types, primaryType, messageObject, showAsString]);

  const handleJsonSubmit = useCallback(() => {
    if (!displayIsConnected) {
      addLog({
        type: 'error',
        data: 'Wallet not connected',
      });
      return;
    }

    try {
      // Use jsonInput if user has typed something, otherwise use the generated jsonPreview
      const jsonToUse = jsonInput || jsonPreview;
      const parsed = JSON.parse(jsonToUse);

      if (showAsString) {
        // Sign the JSON stringified version
        signTypedData({
          domain: { name: 'String Message' },
          types: {
            Message: [{ name: 'data', type: 'string' }],
          },
          primaryType: 'Message',
          message: { data: JSON.stringify(parsed) },
        });
      } else {
        signTypedData(parsed);
      }
    } catch (err) {
      addLog({
        type: 'error',
        data: `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }, [jsonInput, jsonPreview, signTypedData, displayIsConnected, addLog, showAsString]);

  useEffect(() => {
    if (signature) {
      addLog({
        type: 'message',
        data: `EIP-712 signature successful: ${signature}`,
      });
    }
  }, [signature, addLog]);

  useEffect(() => {
    if (error) {
      addLog({
        type: 'error',
        data: `EIP-712 signature failed: ${error.message}`,
      });
    }
  }, [error, addLog]);

  return (
    <div className="h-full bg-black overflow-auto">
      <div className="min-h-full flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-8 w-full">
          {/* Connection Status */}
          {!displayIsConnected && <ConnectWalletPrompt />}

          {displayIsConnected && (
            <div className="space-y-8">
              {/* Mode Toggle */}
              <div className="flex items-center justify-end">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setMode('builder')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mode === 'builder' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Form Builder
                  </button>
                  <button
                    onClick={() => setMode('json')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      mode === 'json' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    JSON Editor
                  </button>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-4">
                <label className="text-white text-sm font-medium">Templates</label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {Object.keys(SHORTCUT_TEMPLATES).map((templateName) => (
                    <PillButton
                      key={templateName}
                      onClick={() => loadShortcut(templateName as keyof typeof SHORTCUT_TEMPLATES)}
                    >
                      {templateName}
                    </PillButton>
                  ))}
                </div>
              </div>

              {mode === 'builder' ? (
                <div className="space-y-12">
                  {/* Domain Configuration */}
                  <div className="space-y-6">
                    <button
                      onClick={() => setShowDomainConfig(!showDomainConfig)}
                      className="flex items-center justify-between w-full text-left group cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        Domain Configuration
                      </h3>
                      <span className="text-gray-400 text-xl group-hover:text-blue-400 transition-colors">
                        {showDomainConfig ? '−' : '+'}
                      </span>
                    </button>

                    {showDomainConfig && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Name"
                          type="text"
                          value={domain.name || ''}
                          readOnly
                          className="bg-gray-700 text-gray-300 px-3 py-2 text-sm"
                        />
                        <Input
                          label="Version"
                          type="text"
                          value={domain.version || ''}
                          onChange={(e) => setDomain((prev) => ({ ...prev, version: e.target.value }))}
                          className="px-3 py-2 text-sm"
                        />
                        <Input
                          label="Chain ID (synced with wallet)"
                          type="number"
                          value={domain.chainId || ''}
                          readOnly
                          className="bg-gray-700 text-gray-300 px-3 py-2 text-sm"
                        />
                        <Input
                          label="Verifying Contract"
                          type="text"
                          value={domain.verifyingContract || ''}
                          onChange={(e) =>
                            setDomain((prev) => ({ ...prev, verifyingContract: e.target.value as `0x${string}` }))
                          }
                          placeholder="0x..."
                          className="px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Message Configuration */}
                  <div className="space-y-6">
                    <button
                      onClick={() => setShowMessageConfig(!showMessageConfig)}
                      className="flex items-center justify-between w-full text-left group cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                        Message Configuration
                      </h3>
                      <span className="text-gray-400 text-xl group-hover:text-blue-400 transition-colors">
                        {showMessageConfig ? '−' : '+'}
                      </span>
                    </button>

                    {showMessageConfig && (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                        {/* Types Configuration */}
                        <div className="space-y-8">
                          {/* Custom Types */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-semibold text-white">Custom Types</h4>
                              <button
                                onClick={addCustomType}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Add Type
                              </button>
                            </div>

                            <div className="space-y-6 max-h-96 overflow-y-auto">
                              {customTypes.map((customType, typeIndex) => (
                                <div
                                  key={typeIndex}
                                  className="space-y-4 p-6 bg-gray-900/50 rounded-2xl border border-gray-700/50"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <Input
                                      type="text"
                                      value={customType.name}
                                      onChange={(e) => updateCustomType(typeIndex, { name: e.target.value })}
                                      className="text-sm bg-gray-800 font-medium px-3 py-1.5"
                                      placeholder="Type name"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => addFieldToType(typeIndex)}
                                        className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                      >
                                        Add Field
                                      </button>
                                      <button
                                        onClick={() => removeCustomType(typeIndex)}
                                        className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    {customType.fields.map((field, fieldIndex) => (
                                      <div key={fieldIndex} className="flex items-center gap-3">
                                        <div className="flex-1">
                                          <Input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) =>
                                              updateTypeField(typeIndex, fieldIndex, { name: e.target.value })
                                            }
                                            placeholder="Field name"
                                            className="text-sm px-3 py-1.5"
                                          />
                                        </div>
                                        <select
                                          value={field.type}
                                          onChange={(e) =>
                                            updateTypeField(typeIndex, fieldIndex, { type: e.target.value })
                                          }
                                          className="px-2 py-1.5 text-xs border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[100px]"
                                        >
                                          {EIP712_TYPES.map((type) => (
                                            <option key={type} value={type}>
                                              {type}
                                            </option>
                                          ))}
                                          {customTypes.map((ct) => (
                                            <option key={ct.name} value={ct.name}>
                                              {ct.name}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => removeFieldFromType(typeIndex, fieldIndex)}
                                          className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 transition-colors text-xs"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Message Construction */}
                        <div className="space-y-8">
                          {/* Primary Type */}
                          <div className="space-y-4">
                            <h4 className="text-xl font-semibold text-white">Primary Type</h4>
                            <select
                              value={primaryType}
                              onChange={(e) => setPrimaryType(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-600 rounded-xl bg-black text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                              {customTypes.map((type) => (
                                <option key={type.name} value={type.name}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Message Fields */}
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xl font-semibold text-white">Message Data</h4>
                              <button
                                onClick={addMessageField}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Add Field
                              </button>
                            </div>

                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                              {messageFields.map((field, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <Input
                                      type="text"
                                      value={field.key}
                                      onChange={(e) => updateMessageField(index, { key: e.target.value })}
                                      placeholder="Field path (e.g., from.name)"
                                      className="text-sm px-3 py-1.5"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Input
                                      type="text"
                                      value={field.value}
                                      onChange={(e) => updateMessageField(index, { value: e.target.value })}
                                      placeholder="Value"
                                      className="text-sm px-3 py-1.5"
                                    />
                                  </div>
                                  <select
                                    value={field.type}
                                    onChange={(e) => updateMessageField(index, { type: e.target.value })}
                                    className="px-2 py-1.5 text-xs border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-w-[100px]"
                                  >
                                    {EIP712_TYPES.map((type) => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                    {customTypes.map((ct) => (
                                      <option key={ct.name} value={ct.name}>
                                        {ct.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => removeMessageField(index)}
                                    className="text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded px-2 py-1 flex-shrink-0 transition-colors text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Signing Options */}
                  <div className="space-y-8">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={showAsString}
                        onChange={setShowAsString}
                        leftLabel="Structured Data"
                        rightLabel="JSON String"
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={handleBuilderSubmit}
                        disabled={isPending || !displayIsConnected}
                        isLoading={isPending}
                        loadingText="Signing..."
                        fullWidth
                      >
                        Sign Typed Data
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-white text-sm font-medium">EIP-712 JSON Configuration</label>
                    <textarea
                      value={jsonInput || jsonPreview}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-96 p-4 bg-black border border-gray-700 rounded-2xl text-green-400 placeholder-gray-500 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Paste your EIP-712 JSON configuration here..."
                    />
                  </div>

                  {/* Signing Options */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={showAsString}
                        onChange={setShowAsString}
                        leftLabel="Structured Data"
                        rightLabel="JSON String"
                      />
                    </div>

                    <div className="flex justify-center">
                      <Button
                        onClick={handleJsonSubmit}
                        disabled={isPending || !displayIsConnected}
                        isLoading={isPending}
                        loadingText="Signing..."
                        fullWidth
                      >
                        Sign JSON Data
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {signature && (
                <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                  <h3 className="font-medium text-green-100 mb-2">Signature Generated</h3>
                  <p className="text-sm text-green-200 font-mono break-all">{signature}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
