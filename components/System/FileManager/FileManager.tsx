import type {
  DirectoryEntry,
  DirectoryEntryDoubleClick,
  DirectoryType
} from '@/types/components/System/FileManager/FileManager';

import { extname, resolve } from 'path';
import { FileContext } from '@/contexts/FileSystem';
import { getDirectory, getDirectoryEntry } from '@/utils/filemanager';
import { ProcessContext } from '@/contexts/ProcessManager';
import { SessionContext } from '@/contexts/SessionManager';
import { useContext, useEffect, useState } from 'react';
import { useFileDrop } from '@/utils/events';

const FileManager: React.FC<DirectoryType> = ({
  path: directoryPath,
  render,
  details = false,
  onChange
}) => {
  const [cwd, cd] = useState(directoryPath);
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const fs = useContext(FileContext);
  const { load, open, restore } = useContext(ProcessContext);
  const { foreground, getState } = useContext(SessionContext);
  const fileDropHandler = useFileDrop(async (dragEvent, file) => {
    load(file, getState({ name: file.name }), dragEvent.target);
    fs.writeFile(`${cwd}/${file.name}`, file);
    setEntries([
      ...entries,
      await getDirectoryEntry(fs, cwd, file.name, details)
    ]);
  });
  const onDoubleClick = ({
    path,
    url,
    icon = '',
    name = ''
  }: DirectoryEntryDoubleClick) => (event: React.MouseEvent<Element>) => {
    if (path && !path.includes('.url') && (path === '..' || !extname(path))) {
      cd(path === '..' ? resolve(cwd, '..') : path);
    } else {
      const processsId = open(
        { url: url || path || '', icon, name },
        getState({ name }),
        event.currentTarget
      );
      restore(processsId, 'minimized');
      foreground(processsId);
    }
  };

  useEffect(() => {
    getDirectory(fs, cwd, details, setEntries);
    onChange?.(cwd);
  }, [fs, cwd]);

  return (
    <div {...fileDropHandler}>{render({ entries, onDoubleClick, cwd })}</div>
  );
};

export default FileManager;
