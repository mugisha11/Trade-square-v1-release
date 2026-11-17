import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckSquare,
  FolderLock,
  Loader2,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type {
  BusinessRequirementsProfile,
  ChecklistItem,
  ComplianceWorkspacePayload,
} from '../../../types/compliance';
import type { BusinessProfile } from '../../../types/workspace';
import { authFetch } from '../../../lib/authClient';
import { ComplianceChecklistTab } from './ComplianceChecklistTab';
import { RequirementsProfileTab } from './RequirementsProfileTab';
import { DocumentVaultTab } from './DocumentVaultTab';
import { ExperienceEvidenceTab } from './ExperienceEvidenceTab';
import { ComplianceAssistantAndSourcesTab } from './ComplianceAssistantAndSourcesTab';

interface ComplianceCentreProps {
  onBusinessSynced?: (updated: BusinessProfile) => void;
  onShowToast?: (kind: 'success' | 'error', text: string) => void;
}

type ComplianceSubTab =
  | 'checklist'
  | 'profile'
  | 'vault'
  | 'experience'
  | 'assistant';

export function ComplianceCentre({
  onBusinessSynced,
  onShowToast,
}: ComplianceCentreProps) {
  const [subTab, setSubTab] = useState<ComplianceSubTab>('checklist');
  const [workspace, setWorkspace] = useState<ComplianceWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [preselectedRule, setPreselectedRule] = useState<ChecklistItem | null>(null);
  const [focusedDocumentId, setFocusedDocumentId] = useState<string | null>(null);
  const [assistantInitialQuestion, setAssistantInitialQuestion] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch('/api/compliance/workspace');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to load compliance workspace.');
      }
      setWorkspace(data.workspace);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load compliance workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  async function handleSaveRequirementsProfile(updated: BusinessRequirementsProfile) {
    const res = await authFetch('/api/compliance/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (!res.ok) {
      onShowToast?.('error', data.error || 'Could not update requirements profile.');
      throw new Error(data.error || 'Could not update requirements profile.');
    }
    setWorkspace(data.workspace);
    if (data.business) {
      onBusinessSynced?.(data.business);
    }
    onShowToast?.('success', 'Compliance requirements profile updated.');
  }

  async function handleToggleNotApplicable(ruleId: string, markNA: boolean, reason?: string) {
    const res = await authFetch(`/api/compliance/checklist/${encodeURIComponent(ruleId)}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markedNotApplicable: markNA,
        notApplicableReason: reason ?? '',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      onShowToast?.('error', data.error || 'Could not update checklist item.');
      return;
    }
    setWorkspace(data.workspace);
    onShowToast?.('success', markNA ? 'Requirement marked Not Applicable.' : 'Requirement restored to checklist.');
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#0A66C2] dark:text-[#1D9BF0]" />
        <p className="text-xs font-medium text-[#525866] dark:text-[#71767B]">
          Evaluating personalised regulatory &amp; trade readiness checklist...
        </p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-8 text-center space-y-3">
        <AlertCircle className="w-7 h-7 text-rose-600 dark:text-[#F4212E] mx-auto" />
        <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
          {error || 'Compliance workspace is unavailable.'}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            loadWorkspace();
          }}
          className="px-4 py-2 rounded-lg bg-[#0A66C2] text-white text-xs font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const subTabs: Array<{
    id: ComplianceSubTab;
    label: string;
    icon: typeof CheckSquare;
    count?: number;
  }> = [
    {
      id: 'checklist',
      label: 'Checklist & Readiness',
      icon: CheckSquare,
      count: workspace.readinessSummary.totalApplicableItems,
    },
    {
      id: 'profile',
      label: 'Requirements Profile',
      icon: SlidersHorizontal,
    },
    {
      id: 'vault',
      label: 'Document Vault & AI',
      icon: FolderLock,
      count: workspace.documents.length,
    },
    {
      id: 'experience',
      label: 'Experience & Performance',
      icon: Award,
      count: workspace.experienceRecords.length,
    },
    {
      id: 'assistant',
      label: 'AI Assistant & Sources',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Strip */}
      <div className="bg-white dark:bg-[#16181C] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl p-1.5 flex flex-wrap items-center gap-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#0A66C2] text-white dark:bg-[#1D9BF0]'
                  : 'text-[#525866] dark:text-[#71767B] hover:bg-[#F3F6F8] dark:hover:bg-[#202327] hover:text-[#191919] dark:hover:text-[#E7E9EA]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] tabular-nums ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E2E8F0]/70 dark:bg-[#2F3336] text-[#334155] dark:text-[#E7E9EA]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {subTab === 'checklist' && (
        <ComplianceChecklistTab
          checklist={workspace.checklist}
          summary={workspace.readinessSummary}
          rulesLastReviewed={workspace.rulesLastReviewed}
          onUploadForRule={(item) => {
            setPreselectedRule(item);
            setFocusedDocumentId(null);
            setSubTab('vault');
          }}
          onViewDocument={(docId) => {
            setPreselectedRule(null);
            setFocusedDocumentId(docId);
            setSubTab('vault');
          }}
          onToggleNotApplicable={handleToggleNotApplicable}
          onAskClarification={(item) => {
            setAssistantInitialQuestion(
              `Please explain "${item.documentName}" (${item.effectiveClassification}) for ${item.destinationJurisdiction ?? item.jurisdiction}, why it applies to my business, and exact official steps to obtain it.`
            );
            setSubTab('assistant');
          }}
          onOpenProfileEditor={() => setSubTab('profile')}
        />
      )}

      {subTab === 'profile' && (
        <RequirementsProfileTab
          profile={workspace.requirementsProfile}
          countryRegistry={workspace.countryRegistry}
          onSaveProfile={handleSaveRequirementsProfile}
        />
      )}

      {subTab === 'vault' && (
        <DocumentVaultTab
          documents={workspace.documents}
          checklist={workspace.checklist}
          defaultCountry={workspace.requirementsProfile.registrationCountry}
          preselectedChecklistItem={preselectedRule}
          focusedDocumentId={focusedDocumentId}
          onClearPreselection={() => {
            setPreselectedRule(null);
            setFocusedDocumentId(null);
          }}
          onWorkspaceRefresh={loadWorkspace}
          onShowToast={onShowToast}
        />
      )}

      {subTab === 'experience' && (
        <ExperienceEvidenceTab
          records={workspace.experienceRecords}
          defaultSector={workspace.requirementsProfile.industry}
          onWorkspaceRefresh={loadWorkspace}
          onShowToast={onShowToast}
        />
      )}

      {subTab === 'assistant' && (
        <ComplianceAssistantAndSourcesTab
          sourceRegistry={workspace.sourceRegistry}
          rulesCatalogCount={workspace.rulesCatalogCount}
          rulesLastReviewed={workspace.rulesLastReviewed}
          initialQuestion={assistantInitialQuestion}
          onClearInitialQuestion={() => setAssistantInitialQuestion(null)}
        />
      )}
    </div>
  );
}
