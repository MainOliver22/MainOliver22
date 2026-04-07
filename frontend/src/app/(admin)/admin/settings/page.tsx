'use client';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Settings, ShieldCheck, DollarSign, Bot } from 'lucide-react';

const sections = [
  {
    icon: DollarSign,
    title: 'Fee Configuration',
    description: 'Manage deposit, withdrawal, and exchange fees. Fee rules are configured at the database level via the fee_configs table.',
    status: 'Database-managed',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Rules',
    description: 'AML/KYC risk rules, sanctions lists, and transaction limits are configured via the risk_rules table.',
    status: 'Database-managed',
  },
  {
    icon: Bot,
    title: 'Bot Strategies',
    description: 'Create and manage bot trading strategies via the Bots section. Strategies can be activated or deactivated.',
    status: 'Managed via Bots',
  },
  {
    icon: Settings,
    title: 'System Configuration',
    description: 'Environment variables control KYC provider, payment gateway, email service, and other integrations. Edit the .env file to update.',
    status: 'Environment variables',
  },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Platform configuration overview. Most settings are managed via environment variables or directly in the database.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(({ icon: Icon, title, description, status }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {status}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
