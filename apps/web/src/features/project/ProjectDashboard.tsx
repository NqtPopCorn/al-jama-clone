import React from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import {
  FileText,
  Layers,
  CheckSquare,
  FolderTree,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface ProjectDashboardProps {
  projectDetails?: any;
  isLoading?: boolean;
  onOpenListView?: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projectDetails,
  isLoading,
  onOpenListView,
}) => {
  const { setActiveView } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  if (isLoading || !projectDetails) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const stats = projectDetails.stats || {};
  const statusBreakdown = stats.statusBreakdown || [];
  const typeBreakdown = stats.typeBreakdown || [];

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 md:p-8 space-y-6 w-full text-xs font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0d1117] text-slate-100' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      {/* 1. Project Banner Card */}
      <Card
        className={`p-6 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-[#30363d] text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge
                variant={isDark ? 'secondary' : 'outline'}
                className="font-mono text-xs font-bold"
              >
                {projectDetails.key}
              </Badge>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Project Overview & Metrics
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{projectDetails.name}</h1>
            <p
              className={`max-w-2xl text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              {projectDetails.description ||
                'Enterprise requirements baseline and traceability project.'}
            </p>
          </div>

          <Button
            variant="default"
            size="default"
            onClick={() => {
              setActiveView('list');
              if (onOpenListView) onOpenListView();
            }}
            className="self-start md:self-auto gap-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white"
          >
            <span>Open List View</span>
            <ArrowUpRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Items */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {stats.totalItems || 0}
              </div>
              <div
                className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Total Items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Folders */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {stats.totalFolders || 0}
              </div>
              <div
                className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Folders
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Items */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {statusBreakdown.find((s: any) => s.status?.toLowerCase() === 'approved')?.count ||
                  0}
              </div>
              <div
                className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                Approved Items
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Review */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-2xs'
          }`}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div
                className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {statusBreakdown.find((s: any) => s.status?.toLowerCase().includes('review'))
                  ?.count || 0}
              </div>
              <div
                className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
              >
                In Review
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown by Type */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              <Layers className="w-4 h-4 text-blue-500" />
              Items by Type (Requirement, Use Case, Test Case)
            </CardTitle>
            <CardDescription>
              Distribution of configured items across requirement specifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {typeBreakdown.map((t: any) => {
              const totalItems = stats.totalItems || 1;
              const percent = Math.round((t.count / totalItems) * 100);

              return (
                <div key={t.key} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                    >
                      {t.name} ({t.key})
                    </span>
                    <span
                      className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {t.count} items ({percent}%)
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.key === 'REQ'
                          ? 'bg-blue-500'
                          : t.key === 'UC'
                            ? 'bg-purple-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Breakdown by Workflow Status */}
        <Card
          className={`transition-colors ${
            isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={`text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              Workflow Status Distribution
            </CardTitle>
            <CardDescription>
              Item states through specification authoring and review lifecycle.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {statusBreakdown.map((s: any) => {
              const totalItems = stats.totalItems || 1;
              const percent = Math.round((s.count / totalItems) * 100);

              return (
                <div key={s.status} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span
                      className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
                    >
                      {s.status}
                    </span>
                    <span
                      className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {s.count} items ({percent}%)
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.status?.toLowerCase() === 'approved'
                          ? 'bg-emerald-500'
                          : s.status?.toLowerCase().includes('review')
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
