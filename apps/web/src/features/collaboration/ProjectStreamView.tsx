import React from 'react';
import { JamaStreamSection } from './components/JamaStreamSection';
import { useProjectStore } from '../../stores/project.store';
import { FolderGit2 } from 'lucide-react';

interface ProjectStreamViewProps {
  onOpenItem?: (itemId: string) => void;
}

export const ProjectStreamView: React.FC<ProjectStreamViewProps> = ({ onOpenItem }) => {
  const { currentProject } = useProjectStore();

  if (!currentProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8fafc]">
        <FolderGit2 className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-bold text-slate-700">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Please select a project from the project list to view its collaboration stream.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#eef2f6] dark:bg-[#0d1117] p-6">
      <div className="max-w-5xl w-full mx-auto">
        <JamaStreamSection
          projectId={currentProject.id}
          showStreamHeader={true}
          onNavigateToItem={onOpenItem}
        />
      </div>
    </div>
  );
};
