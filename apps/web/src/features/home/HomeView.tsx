import React from 'react';
import { useProjectStore } from '../../stores/project.store';
import { useThemeStore } from '../../stores/theme.store';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Folder, FileText, Layers, CheckSquare, Flag } from 'lucide-react';
import { ProjectSummary } from '@aljama/shared';

interface HomeViewProps {
  projects?: ProjectSummary[];
  onOpenProject: (projectId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ projects, onOpenProject }) => {
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
            Home
          </h1>
        </div>

        {/* 2-Column Layout (Matching Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Recently Viewed (Span 2) */}
          <div className="md:col-span-2 space-y-3">
            <h2
              className={`text-sm font-bold border-b pb-2 ${
                isDark ? 'text-slate-100 border-[#30363d]' : 'text-slate-900 border-slate-100'
              }`}
            >
              Recently Viewed
            </h2>

            <div
              className={`divide-y rounded-md overflow-hidden border shadow-xs ${
                isDark
                  ? 'bg-[#1c2128] border-[#30363d] divide-[#30363d]'
                  : 'bg-white border-slate-200 divide-slate-100'
              }`}
            >
              {/* Recently viewed project item 1 */}
              <div
                onClick={() => currentProject && onOpenProject(currentProject.id)}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-[#22272e]' : 'hover:bg-[#f0f7ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-semibold text-blue-600 group-hover:underline">
                    {currentProject?.name || 'Medical Device Control System'}
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Project
                </Badge>
              </div>

              {/* Recently viewed item 2 */}
              <div
                onClick={() => {
                  if (currentProject) onOpenProject(currentProject.id);
                }}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-[#22272e]' : 'hover:bg-[#f0f7ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-blue-600 group-hover:underline">
                    {currentProject?.name}: 1. System Requirements
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Folder
                </Badge>
              </div>

              {/* Recently viewed item 3 */}
              <div
                onClick={() => {
                  if (currentProject) onOpenProject(currentProject.id);
                }}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-[#22272e]' : 'hover:bg-[#f0f7ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-blue-600 group-hover:underline">
                    {currentProject?.name}: 1.1 Safety & Alarms
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Folder
                </Badge>
              </div>

              {/* Recently viewed item 4 */}
              <div
                onClick={() => {
                  if (currentProject) onOpenProject(currentProject.id);
                }}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-[#22272e]' : 'hover:bg-[#f0f7ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-blue-600 group-hover:underline">
                    {currentProject?.name}: 2. Software Architecture
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Folder
                </Badge>
              </div>

              {/* Recently viewed item 5 */}
              <div
                onClick={() => {
                  if (currentProject) onOpenProject(currentProject.id);
                }}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-[#22272e]' : 'hover:bg-[#f0f7ff]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-blue-600 group-hover:underline">
                    {currentProject?.name}: 3. Verification & Validation
                  </span>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Folder
                </Badge>
              </div>
            </div>
          </div>

          {/* Right Column: Active Reviews & Stream Activity (Matching Image 2) */}
          <div className="space-y-6">
            {/* Active Reviews Widget */}
            <div className="space-y-2.5">
              <h2
                className={`text-sm font-bold border-b pb-2 ${
                  isDark ? 'text-slate-100 border-[#30363d]' : 'text-slate-900 border-slate-100'
                }`}
              >
                Active Reviews
              </h2>
              <Card
                className={`p-4 space-y-3 shadow-xs ${
                  isDark ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-slate-200'
                }`}
              >
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  You have <strong className="text-blue-500 font-bold">1 active review</strong>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                      Set: Safety Requirements
                    </span>
                    <Badge variant="moderating">MODERATING</Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>14 days left</span>
                    <div className="flex items-center gap-1.5">
                      <span>Progress</span>
                      <div
                        className={`w-14 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                      >
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: '25%' }}
                        />
                      </div>
                      <span className="font-mono">25%</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-right ${isDark ? 'border-[#30363d]' : 'border-slate-100'}`}
                >
                  <a
                    href="#reviews"
                    onClick={e => {
                      e.preventDefault();
                      alert('Review Center is active across assigned review baselines!');
                    }}
                    className="text-xs text-blue-500 hover:underline font-semibold"
                  >
                    View All Reviews →
                  </a>
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
                Stream Activity
              </h2>
              <Card
                className={`p-4 space-y-3 shadow-xs ${
                  isDark ? 'bg-[#1c2128] border-[#30363d]' : 'bg-white border-slate-200'
                }`}
              >
                <div className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                  You are in{' '}
                  <strong className="text-blue-500 font-bold">1 open conversation</strong>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Flag className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-blue-500 hover:underline cursor-pointer">
                      1 Open Issue
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      with Alex Morgan (Project Engineer)
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-2 border-t text-right ${isDark ? 'border-[#30363d]' : 'border-slate-100'}`}
                >
                  <a
                    href="#stream"
                    onClick={e => {
                      e.preventDefault();
                      alert('Stream conversations are accessible directly from item panels!');
                    }}
                    className="text-xs text-blue-500 hover:underline font-semibold"
                  >
                    View All Stream Activity →
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
