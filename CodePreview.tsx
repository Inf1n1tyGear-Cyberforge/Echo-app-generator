import { useState } from 'react';
import { Check, Copy, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodePreviewProps {
  files: Record<string, string>;
}

export default function CodePreview({ files }: CodePreviewProps) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(fileNames[0] || '');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (fileNames.length === 0) {
    return (
      <div className="card p-8 text-center">
        <FileCode className="w-12 h-12 text-text-dim mx-auto mb-3" />
        <p className="text-text-muted">No code generated yet</p>
      </div>
    );
  }

  const handleCopy = async () => {
    const content = files[activeFile];
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguage = (filename: string): string => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.css')) return 'css';
    return 'typescript';
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border/50">
      {/* File tabs */}
      <div className="flex items-center justify-between bg-surface px-4 py-2 border-b border-border/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <FileCode className="w-4 h-4" />
          <span className="font-medium">{fileNames.length} files</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted/50"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col sm:flex-row">
          {/* File sidebar */}
          <div className="sm:w-48 border-r border-border/50 bg-surface/50">
            <div className="p-2 space-y-0.5">
              {fileNames.map(file => (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeFile === file
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-muted hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <span className="truncate block">{file.split('/').pop()}</span>
                  <span className="text-[10px] text-text-dim block truncate">{file}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code display */}
          <div className="flex-1 overflow-auto max-h-[500px]">
            <SyntaxHighlighter
              language={getLanguage(activeFile)}
              style={oneDark}
              customStyle={{
                margin: 0,
                borderRadius: 0,
                fontSize: '13px',
                lineHeight: '1.6',
                background: '#0d0d14',
              }}
              showLineNumbers
            >
              {files[activeFile] || ''}
            </SyntaxHighlighter>
          </div>
        </div>
      )}
    </div>
  );
}