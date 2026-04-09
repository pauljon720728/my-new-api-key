import { useState, useEffect, useRef } from 'react';
import Split from 'react-split';
import Editor from '@monaco-editor/react';
import { Send, Sparkles, Code2, Globe, FileCode2, Play } from 'lucide-react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setProjectData(null);
    try {
      const response = await fetch('http://localhost:3001/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate');
      setProjectData(data);
      setActiveFileIndex(0);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const activeFile = projectData?.files[activeFileIndex];

  // Helper to construct self-contained HTML for web previews
  const getHtmlPreviewContent = () => {
    if (!projectData) return '';
    const htmlFile = projectData.files.find(f => f.filename.endsWith('.html'));
    if (!htmlFile) return null;

    let content = htmlFile.content;
    
    // Inject CSS
    const cssFiles = projectData.files.filter(f => f.filename.endsWith('.css'));
    let styles = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n');
    if (styles) content = content.replace('</head>', `${styles}</head>`);

    // Inject JS
    const jsFiles = projectData.files.filter(f => f.filename.endsWith('.js') && !f.filename.includes('vite'));
    let scripts = jsFiles.map(f => `<script>\n${f.content}\n</script>`).join('\n');
    if (scripts) content = content.replace('</body>', `${scripts}</body>`);

    return content;
  };

  return (
    <div className="app-container">
      <header className="header">
        <Sparkles size={24} className="header-icon" color="#3b82f6" />
        <span>Emergent AI <span className="header-accent">Developer</span></span>
      </header>

      {!projectData && !isGenerating && (
        <main className="hero-container">
          <h1 className="hero-title">What do you want to build?</h1>
          <input
            type="password"
            className="prompt-input"
            style={{maxWidth: '300px', marginBottom: '16px', background: 'var(--panel-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.9rem'}}
            placeholder="Enter your Emergent API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="prompt-box">
            <input
              type="text"
              className="prompt-input"
              placeholder="A python script to scrape data, a React to-do list, a SQL schema..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button 
              className="generate-btn" 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim() || !apiKey.trim()}
            >
              <Send size={18} />
              Generate
            </button>
          </div>
        </main>
      )}

      {isGenerating && (
        <main className="hero-container">
          <Sparkles size={48} className="spinner" color="#3b82f6" />
          <h2 style={{ marginTop: '20px', color: 'var(--text-secondary)'}}>Crafting your application...</h2>
        </main>
      )}

      {projectData && !isGenerating && (
        <div className="workspace">
          <Split 
            sizes={[50, 50]} 
            minSize={300} 
            expandToMin={false} 
            gutterSize={4} 
            gutterAlign="center" 
            snapOffset={30} 
            dragInterval={1} 
            direction="horizontal" 
            cursor="col-resize"
            className="split-pane"
          >
             {/* Left Pane - Editor */}
             <div className="editor-section">
                <div className="file-tabs">
                  {projectData.files.map((file, idx) => (
                    <div 
                      key={idx} 
                      className={`file-tab ${idx === activeFileIndex ? 'active' : ''}`}
                      onClick={() => setActiveFileIndex(idx)}
                    >
                      <FileCode2 size={16} />
                      {file.filename}
                    </div>
                  ))}
                </div>
                <div className="editor-container">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    path={activeFile?.filename}
                    language={activeFile?.language || 'javascript'}
                    value={activeFile?.content || ''}
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                </div>
                <div className="workspace-bottom-bar">
                  <div className="prompt-box" style={{maxWidth: '100%'}}>
                    <input
                      type="text"
                      className="prompt-input"
                      placeholder="Ask for changes..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button className="generate-btn" onClick={handleGenerate}>
                      <Send size={16} /> Update
                    </button>
                  </div>
                </div>
             </div>

             {/* Right Pane - Preview */}
             <div className="preview-section">
                <div className="preview-header">
                  <Globe size={18} />
                  Live Preview Container
                </div>
                {getHtmlPreviewContent() ? (
                  <iframe 
                    title="preview"
                    className="preview-content"
                    srcDoc={getHtmlPreviewContent()}
                    sandbox="allow-scripts allow-modals"
                  />
                ) : (
                  <div style={{padding: '24px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div className="explanation-banner" style={{marginBottom: '20px', borderRadius: '8px', color: '#1e293b'}}>
                      <strong>AI Explanation:</strong> {projectData.explanation}
                    </div>
                    
                    {activeFile?.filename.endsWith('.py') ? (
                      <PythonRunner code={activeFile.content} />
                    ) : (
                      <div style={{textAlign: 'center', color: '#64748b', marginTop: '40px'}}>
                        <Code2 size={64} style={{opacity: 0.2, margin: '0 auto 16px'}} />
                        <h3>{activeFile?.filename}</h3>
                        <p>No visual preview available for this file type.</p>
                        <p style={{fontSize: '0.85rem', marginTop: '8px'}}>Copy the code to use it locally.</p>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </Split>
        </div>
      )}
    </div>
  );
}

// A simple component to run python code using Pyodide dynamically
function PythonRunner({ code }) {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runPython = async () => {
    setIsRunning(true);
    setOutput('Loading Pyodide environment...');
    try {
      if (!window.loadPyodide) {
        // Load Pyodide script
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      
      const pyodide = await window.loadPyodide();
      
      // Redirect stdout
      pyodide.runPython(`
import sys
import io
sys.stdout = io.StringIO()
      `);
      
      await pyodide.runPythonAsync(code);
      const stdout = pyodide.runPython("sys.stdout.getvalue()");
      setOutput(stdout || 'Script executed successfully with no output.');
    } catch (err) {
      setOutput(`Error:\n${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{background: '#1e293b', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, maxHeight: '400px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <span style={{color: '#fff', fontWeight: 600}}>Python Execution Engine</span>
        <button 
          onClick={runPython} 
          disabled={isRunning}
          style={{display: 'flex', alignItems: 'center', gap: '6px', background: '#22c55e', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600}}
        >
          <Play size={14} /> {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>
      <div style={{background: '#0f172a', color: '#10b981', padding: '12px', borderRadius: '4px', flex: 1, overflowY: 'auto', fontFamily: 'monospace', whiteSpace: 'pre-wrap'}}>
        {output || 'Click "Run Code" to execute this Python script in the browser.'}
      </div>
    </div>
  );
}

export default App;
