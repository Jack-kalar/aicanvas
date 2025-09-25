'use client';

import React, { useState, useRef, useEffect } from 'react';

const SmartCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [showSidebar, setShowSidebar] = useState(false);
  const [tool, setTool] = useState('brush'); // brush, eraser

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    resizeCanvas();
    
    // Set initial canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Resize canvas to fit container
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const container = canvas.parentElement;
    if (!container) return;
    
    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Set canvas dimensions
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Redraw content after resize if needed
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    // Set drawing styles
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    
    // Begin path
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    // Draw line
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Export canvas as image
  const exportCanvas = async (format: 'webp' | 'png' | 'jpeg') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary link
    const link = document.createElement('a');
    link.download = `canvas.${format}`;
    
    // Convert canvas to data URL
    switch (format) {
      case 'webp':
        link.href = canvas.toDataURL('image/webp');
        break;
      case 'png':
        link.href = canvas.toDataURL('image/png');
        break;
      case 'jpeg':
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        break;
    }
    
    // Trigger download
    link.click();
  };

  // Color options
  const colorOptions = [
    '#000000', // Black
    '#ff0000', // Red
    '#00ff00', // Green
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#ff00ff', // Magenta
    '#00ffff', // Cyan
    '#ffffff', // White
  ];

  return (
    <div className="app-container">
      {/* Sidebar for PC, hidden on mobile */}
      <div className={`sidebar ${showSidebar ? '' : 'hidden'}`}>
        <div className="tools-panel">
          <div className="tool-group">
            <h3>Tools</h3>
            <div className="tool-options">
              <button 
                className={`tool-option ${tool === 'brush' ? 'active' : ''}`}
                onClick={() => setTool('brush')}
              >
                Brush
              </button>
              <button 
                className={`tool-option ${tool === 'eraser' ? 'active' : ''}`}
                onClick={() => setTool('eraser')}
              >
                Eraser
              </button>
              <button 
                className="tool-option"
                onClick={clearCanvas}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="tool-group">
            <h3>Brush Size</h3>
            <input 
              type="range" 
              min="1" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
            />
            <span>{brushSize}px</span>
          </div>
          
          <div className="tool-group">
            <h3>Colors</h3>
            <div className="color-picker">
              {colorOptions.map((colorOption) => (
                <div
                  key={colorOption}
                  className={`color-option ${color === colorOption && tool === 'brush' ? 'active' : ''}`}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => {
                    setColor(colorOption);
                    setTool('brush');
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="tool-group">
            <h3>Export</h3>
            <div className="export-buttons">
              <button className="export-button" onClick={() => exportCanvas('png')}>
                PNG
              </button>
              <button className="export-button" onClick={() => exportCanvas('jpeg')}>
                JPEG
              </button>
              <button className="export-button" onClick={() => exportCanvas('webp')}>
                WebP
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main canvas area */}
      <div className="canvas-area">
        {/* Header for mobile */}
        <div className="header">
          <button 
            className="menu-button"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          <h2>AI Canvas</h2>
        </div>
        
        {/* Canvas container */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartCanvas;