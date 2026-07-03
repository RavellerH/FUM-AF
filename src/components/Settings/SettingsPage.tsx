import { CategoryManager } from './CategoryManager';
import { ReParseButton } from './ReParseButton';
import { FilePasswordSetting } from './FilePasswordSetting';
import { RulesManager } from './RulesManager';
import { Card } from '../shared/Card';
import { PageHeader } from '../shared/PageHeader';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Settings" />
      <div className="flex flex-col gap-6">
        <Card className="p-6"><FilePasswordSetting /></Card>
        <Card className="p-6"><RulesManager /></Card>
        <Card className="p-6"><CategoryManager /></Card>
        <Card className="p-6"><ReParseButton /></Card>
      </div>
    </div>
  );
}
