'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminSettingsApi } from '@/lib/api';

interface FeeConfig {
  id: string;
  name: string;
  type: string;
  value: string;
  isPercentage: boolean;
  isActive: boolean;
  asset?: { symbol: string } | null;
}

interface RiskRule {
  id: string;
  name: string;
  type: string;
  scope: string;
  isActive: boolean;
  parameters: Record<string, unknown>;
}

const FEE_TYPES = ['EXCHANGE_SPREAD', 'TRADING_FEE', 'WITHDRAWAL_FEE', 'DEPOSIT_FEE'];
const RISK_TYPES = ['WITHDRAWAL_LIMIT', 'VELOCITY_CHECK', 'POSITION_LIMIT', 'DAILY_LOSS_LIMIT', 'CIRCUIT_BREAKER'];
const RISK_SCOPES = ['GLOBAL', 'PER_USER', 'PER_BOT'];

export default function AdminSettingsPage() {
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [feeSubmitting, setFeeSubmitting] = useState(false);
  const [ruleSubmitting, setRuleSubmitting] = useState(false);
  const [feeForm, setFeeForm] = useState({ name: '', type: 'EXCHANGE_SPREAD', value: '', isPercentage: true, isActive: true });
  const [ruleForm, setRuleForm] = useState({ name: '', description: '', type: 'WITHDRAWAL_LIMIT', scope: 'GLOBAL', parameters: '{}', isActive: true });
  const [feeError, setFeeError] = useState('');
  const [ruleError, setRuleError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadFees = async () => {
    setFeesLoading(true);
    try { setFees(await adminSettingsApi.listFees()); } finally { setFeesLoading(false); }
  };

  const loadRules = async () => {
    setRulesLoading(true);
    try { setRules(await adminSettingsApi.listRiskRules()); } finally { setRulesLoading(false); }
  };

  useEffect(() => { loadFees(); loadRules(); }, []);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeSubmitting(true);
    setFeeError('');
    try {
      await adminSettingsApi.createFee({ ...feeForm, value: parseFloat(feeForm.value) });
      setShowFeeForm(false);
      setFeeForm({ name: '', type: 'EXCHANGE_SPREAD', value: '', isPercentage: true, isActive: true });
      await loadFees();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFeeError(e?.response?.data?.message ?? 'Failed to create fee config.');
    } finally {
      setFeeSubmitting(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    setDeleteLoading(id);
    try { await adminSettingsApi.deleteFee(id); await loadFees(); } finally { setDeleteLoading(null); }
  };

  const handleToggleFee = async (id: string, current: boolean) => {
    await adminSettingsApi.updateFee(id, { isActive: !current });
    await loadFees();
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setRuleSubmitting(true);
    setRuleError('');
    try {
      let params: Record<string, unknown> = {};
      try { params = JSON.parse(ruleForm.parameters); } catch { setRuleError('Parameters must be valid JSON.'); setRuleSubmitting(false); return; }
      await adminSettingsApi.createRiskRule({ ...ruleForm, parameters: params });
      setShowRuleForm(false);
      setRuleForm({ name: '', description: '', type: 'WITHDRAWAL_LIMIT', scope: 'GLOBAL', parameters: '{}', isActive: true });
      await loadRules();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setRuleError(e?.response?.data?.message ?? 'Failed to create risk rule.');
    } finally {
      setRuleSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    setDeleteLoading(id);
    try { await adminSettingsApi.deleteRiskRule(id); await loadRules(); } finally { setDeleteLoading(null); }
  };

  const handleToggleRule = async (id: string, current: boolean) => {
    await adminSettingsApi.updateRiskRule(id, { isActive: !current });
    await loadRules();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage platform fees and risk rules</p>
      </div>

      {/* Fee Configurations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Fee Configurations</h2>
          <Button size="sm" onClick={() => setShowFeeForm(!showFeeForm)}>
            {showFeeForm ? 'Cancel' : '+ Add Fee'}
          </Button>
        </div>

        {showFeeForm && (
          <Card>
            <CardHeader><CardTitle>New Fee Config</CardTitle></CardHeader>
            <form onSubmit={handleCreateFee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" placeholder="e.g. Exchange spread fee" value={feeForm.name} onChange={e => setFeeForm(f => ({ ...f, name: e.target.value }))} required />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={feeForm.type} onChange={e => setFeeForm(f => ({ ...f, type: e.target.value }))}>
                    {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Value" type="number" step="0.0001" placeholder="0.5" value={feeForm.value} onChange={e => setFeeForm(f => ({ ...f, value: e.target.value }))} required />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Fee Mode</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={feeForm.isPercentage ? 'pct' : 'flat'} onChange={e => setFeeForm(f => ({ ...f, isPercentage: e.target.value === 'pct' }))}>
                    <option value="pct">Percentage (%)</option>
                    <option value="flat">Flat amount</option>
                  </select>
                </div>
              </div>
              {feeError && <p className="text-sm text-red-600">{feeError}</p>}
              <Button type="submit" loading={feeSubmitting}>Create Fee</Button>
            </form>
          </Card>
        )}

        {feesLoading ? (
          <Card><p className="text-sm text-gray-400 animate-pulse">Loading fees...</p></Card>
        ) : fees.length === 0 ? (
          <Card><p className="text-sm text-gray-400 text-center py-4">No fee configurations yet</p></Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {['Name', 'Type', 'Value', 'Mode', 'Asset', 'Active', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {fees.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{fee.name}</td>
                    <td className="px-4 py-3 text-gray-500">{fee.type}</td>
                    <td className="px-4 py-3">{parseFloat(fee.value).toFixed(4)}</td>
                    <td className="px-4 py-3">{fee.isPercentage ? '%' : 'Flat'}</td>
                    <td className="px-4 py-3 text-gray-500">{fee.asset?.symbol ?? 'Global'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleFee(fee.id, fee.isActive)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${fee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {fee.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" loading={deleteLoading === fee.id} onClick={() => handleDeleteFee(fee.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Risk Rules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Risk Rules</h2>
          <Button size="sm" onClick={() => setShowRuleForm(!showRuleForm)}>
            {showRuleForm ? 'Cancel' : '+ Add Rule'}
          </Button>
        </div>

        {showRuleForm && (
          <Card>
            <CardHeader><CardTitle>New Risk Rule</CardTitle></CardHeader>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <Input label="Name" placeholder="e.g. Max daily withdrawal $50k" value={ruleForm.name} onChange={e => setRuleForm(f => ({ ...f, name: e.target.value }))} required />
              <Input label="Description" placeholder="Detailed description" value={ruleForm.description} onChange={e => setRuleForm(f => ({ ...f, description: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={ruleForm.type} onChange={e => setRuleForm(f => ({ ...f, type: e.target.value }))}>
                    {RISK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Scope</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={ruleForm.scope} onChange={e => setRuleForm(f => ({ ...f, scope: e.target.value }))}>
                    {RISK_SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Parameters (JSON)</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono min-h-[80px]"
                  placeholder='{"maxAmount": 50000, "currency": "USD"}'
                  value={ruleForm.parameters}
                  onChange={e => setRuleForm(f => ({ ...f, parameters: e.target.value }))}
                  required
                />
              </div>
              {ruleError && <p className="text-sm text-red-600">{ruleError}</p>}
              <Button type="submit" loading={ruleSubmitting}>Create Rule</Button>
            </form>
          </Card>
        )}

        {rulesLoading ? (
          <Card><p className="text-sm text-gray-400 animate-pulse">Loading rules...</p></Card>
        ) : rules.length === 0 ? (
          <Card><p className="text-sm text-gray-400 text-center py-4">No risk rules yet</p></Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {['Name', 'Type', 'Scope', 'Active', 'Params', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{rule.name}</td>
                    <td className="px-4 py-3 text-gray-500">{rule.type}</td>
                    <td className="px-4 py-3">{rule.scope}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleRule(rule.id, rule.isActive)} className={`px-2 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-xs truncate">
                      {JSON.stringify(rule.parameters)}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="danger" loading={deleteLoading === rule.id} onClick={() => handleDeleteRule(rule.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
