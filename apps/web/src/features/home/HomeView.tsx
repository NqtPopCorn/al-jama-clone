import React from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Folder, ArrowRight, Layers, MessageSquare, CheckCircle2 } from 'lucide-react';
import { ProjectSummary } from '@aljama/shared';

interface HomeViewProps {
  projects?: ProjectSummary[];
  onOpenProject: (projectId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ projects = [], onOpenProject }) => {
  const { currentProject } = useProjectStore();
  const { headerTheme } = useThemeStore();
  const isDark = headerTheme === 'dark';

  return (
    <div
      className={`flex-1 overflow-y-auto p-6 lg:p-10 text-xs font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#0f141c] text-slate-200' : 'bg-[#f8fafc] text-slate-800'
      }`}
    >
      <div
        className={`max-w-6xl mx-auto rounded-lg border p-6 lg:p-8 space-y-6 transition-colors ${
          isDark ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Title */}
        <div className={`border-b pb-3 ${isDark ? 'border-[#30363d]' : 'border-slate-200'}`}>
          <h1 className={`text-xl font-normal ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Home Overview
          </h1>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Projects & Active Workspaces (Span 2) */}
          <div className="md:col-span-2 space-y-3">
            <h2
              className={`text-sm font-bold border-b pb-2 ${
                isDark ? 'text-slate-100 border-[#30363d]' : 'text-slate-900 border-slate-100'
              }`}
            >
              Assigned Projects & Workspaces
            </h2>

            <div
              className={`divide-y rounded-md overflow-hidden border shadow-xs ${
                isDark
                  ? 'bg-[#1c2128] border-[#30363d] divide-[#30363d]'
                  : 'bg-white border-slate-200 divide-slate-100'
              }`}
            >
              {projects.length > 0 ? (
                projects.map(proj => {
                  const isCurrent = currentProject?.id === proj.id;
                  return (
                    <div
                      key={proj.id}
                      onClick={() => onOpenProject(proj.id)}
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors group ${
                        isCurrent
                          ? isDark
                            ? 'bg-[#1f2937]'
                            : 'bg-blue-50/70'
                          : isDark
                            ? 'hover:bg-[#22272e]'
                            : 'hover:bg-[#f0f7ff]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className="w-5 h-5 text-blue-500 shrink-0" />
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-blue-600 group-hover:underline text-sm truncate">
                              {proj.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {proj.key}
                            </Badge>
                            {isCurrent && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                              >
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xl">
                            {proj.description ||
                              'Enterprise requirements and verification specifications.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {proj.status}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 italic">
                  No projects assigned. Contact your administrator to join a project.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Reviews & Stream Activity */}
          <div className="space-y-6">
            {/* Review Center Widget */}
            <div className="space-y-2.5">
              <h2
                className={`text-sm font-bold border-b pb-2 ${
                  isDark ? 'text-slate-100 border-[#30363d]' : 'text-slate-900 border-slate-100'
                }`}
              >
                Review Center
              </h2>
              <Card
                className={`p-4 space-y-3 shadow-xs ${
                  isDark ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>Review Baselines & Approvals</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Collaborative peer reviews and electronic signature baselines are configured
                  across requirement sets and specifications.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-[#30363d] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Electronic Signatures</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Enabled
                  </span>
                </div>
              </Card>
            </div>

            {/* Stream Activity Widget */}
            <div className="space-y-2.5">
              <h2
                className={`text-sm font-bold border-b pb-2 ${
                  isDark ? 'text-slate-100 border-[#30363d]' : 'text-slate-900 border-slate-100'
                }`}
              >
                Collaboration Stream
              </h2>
              <Card
                className={`p-4 space-y-3 shadow-xs ${
                  isDark ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Item Stream & @Mentions</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Comment threads, action flags, and team discussions are accessible directly from
                  the side panel of each requirement item.
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-[#30363d] flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Real-time collaboration</span>
                  <span className="font-semibold text-blue-500">Active</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
