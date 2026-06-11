figma.showUI(__html__, { width: 360, height: 300 });

async function loadFonts() {
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    return { family: 'Inter', regular: 'Regular', bold: 'Bold' };
  } catch {
    await figma.loadFontAsync({ family: 'Arial', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Arial', style: 'Bold' });
    return { family: 'Arial', regular: 'Regular', bold: 'Bold' };
  }
}

function hexToRgb(hex, fallback) {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex || '')) return fallback;
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function setSolidFill(node, color) {
  node.fills = [{ type: 'SOLID', color }];
}

function setStroke(node, color) {
  node.strokes = [{ type: 'SOLID', color }];
  node.strokeWeight = 1;
}

function createText(parent, element, fonts, options = {}) {
  const text = figma.createText();
  text.name = element.name || 'Text';
  text.x = element.x || 0;
  text.y = element.y || 0;
  text.resize(element.width || 120, element.height || 32);
  text.fontName = { family: fonts.family, style: options.bold ? fonts.bold : fonts.regular };
  text.fontSize = element.fontSize || options.fontSize || 14;
  text.characters = element.text || element.name || '';
  text.textAutoResize = 'HEIGHT';
  text.fills = [{ type: 'SOLID', color: hexToRgb(element.color, { r: 0.06, g: 0.09, b: 0.16 }) }];
  parent.appendChild(text);
  return text;
}

function createBox(parent, element, defaults = {}) {
  const rect = figma.createRectangle();
  rect.name = element.name || element.type;
  rect.x = element.x || 0;
  rect.y = element.y || 0;
  rect.resize(element.width || 120, element.height || 48);
  rect.cornerRadius = defaults.radius || 12;
  setSolidFill(rect, hexToRgb(element.background, defaults.fill || { r: 1, g: 1, b: 1 }));
  setStroke(rect, hexToRgb(element.borderColor, defaults.stroke || { r: 0.87, g: 0.91, b: 0.96 }));
  parent.appendChild(rect);
  return rect;
}

function appendLabel(parent, element, fonts, options = {}) {
  if (!element.text && !element.name) return;
  createText(
    parent,
    {
      ...element,
      x: (element.x || 0) + (options.xOffset || 14),
      y: (element.y || 0) + (options.yOffset || 14),
      width: Math.max(40, (element.width || 120) - 28),
      height: Math.max(20, (element.height || 48) - 20),
      text: element.text || element.name,
    },
    fonts,
    { bold: options.bold, fontSize: options.fontSize }
  );
}

function drawElement(frame, element, fonts) {
  if (element.type === 'text') {
    createText(frame, element, fonts, { fontSize: element.fontSize || 16 });
    return;
  }

  if (element.type === 'button') {
    createBox(frame, element, { radius: 12, fill: { r: 0.15, g: 0.39, b: 0.92 } });
    createText(
      frame,
      {
        ...element,
        x: (element.x || 0) + 12,
        y: (element.y || 0) + 14,
        width: Math.max(40, (element.width || 120) - 24),
        height: 24,
        color: element.color || '#ffffff',
      },
      fonts,
      { bold: true, fontSize: 14 }
    );
    return;
  }

  if (element.type === 'input') {
    createBox(frame, element, { radius: 12 });
    appendLabel(frame, element, fonts, { yOffset: 14, fontSize: 13 });
    return;
  }

  if (element.type === 'card' || element.type === 'section' || element.type === 'frame') {
    createBox(frame, element, { radius: 16 });
    appendLabel(frame, element, fonts, { bold: true, fontSize: 14 });
    (element.items || []).slice(0, 5).forEach((item, index) => {
      createText(
        frame,
        {
          name: `${element.name || 'item'}-${index + 1}`,
          text: `• ${item}`,
          x: (element.x || 0) + 16,
          y: (element.y || 0) + 44 + index * 22,
          width: Math.max(40, (element.width || 120) - 32),
          height: 20,
          color: '#64748b',
        },
        fonts,
        { fontSize: 12 }
      );
    });
    return;
  }

  if (element.type === 'imagePlaceholder') {
    createBox(frame, element, { radius: 16, fill: { r: 0.95, g: 0.97, b: 1 } });
    appendLabel(frame, { ...element, text: element.text || '图片占位' }, fonts, { fontSize: 12 });
    return;
  }

  if (element.type === 'list') {
    createBox(frame, element, { radius: 16 });
    appendLabel(frame, element, fonts, { bold: true, fontSize: 14 });
    (element.items || ['列表项一', '列表项二', '列表项三']).slice(0, 6).forEach((item, index) => {
      createText(
        frame,
        {
          name: `${element.name || 'list'}-${index + 1}`,
          text: item,
          x: (element.x || 0) + 16,
          y: (element.y || 0) + 44 + index * 26,
          width: Math.max(40, (element.width || 120) - 32),
          height: 22,
          color: '#334155',
        },
        fonts,
        { fontSize: 13 }
      );
    });
    return;
  }

  if (element.type === 'tab') {
    createBox(frame, element, { radius: 12, fill: { r: 0.95, g: 0.97, b: 1 } });
    const items = (element.items || ['选项一', '选项二']).slice(0, 4);
    const itemWidth = (element.width || 160) / items.length;
    items.forEach((item, index) => {
      if (index === 0) {
        createBox(
          frame,
          {
            name: `${element.name}-active`,
            type: 'card',
            x: (element.x || 0) + 4,
            y: (element.y || 0) + 4,
            width: itemWidth - 8,
            height: (element.height || 44) - 8,
            background: '#ffffff',
          },
          { radius: 9 }
        );
      }
      createText(
        frame,
        {
          name: `${element.name}-${index + 1}`,
          text: item,
          x: (element.x || 0) + index * itemWidth + 8,
          y: (element.y || 0) + 13,
          width: itemWidth - 16,
          height: 20,
          color: index === 0 ? '#2563eb' : '#64748b',
        },
        fonts,
        { fontSize: 12 }
      );
    });
    return;
  }

  if (element.type === 'navbar') {
    createBox(frame, element, { radius: 0 });
    appendLabel(frame, element, fonts, { bold: true, yOffset: 22, fontSize: 14 });
    return;
  }

  createBox(frame, { ...element, text: `不支持：${element.type}` }, { fill: { r: 1, g: 0.98, b: 0.9 } });
  appendLabel(frame, { ...element, text: `不支持：${element.type}` }, fonts, { fontSize: 12 });
}

function drawPrototype(spec, fonts) {
  const created = [];
  const gap = 80;
  let offsetX = figma.viewport.center.x - (spec.frames[0]?.width || 390) / 2;

  for (const sourceFrame of spec.frames || []) {
    const frame = figma.createFrame();
    frame.name = sourceFrame.name || spec.name || 'PM Hub Prototype';
    frame.x = offsetX;
    frame.y = figma.viewport.center.y - (sourceFrame.height || 844) / 2;
    frame.resize(sourceFrame.width || spec.canvas.width, sourceFrame.height || spec.canvas.height);
    frame.cornerRadius = 0;
    setSolidFill(frame, { r: 0.97, g: 0.98, b: 1 });
    figma.currentPage.appendChild(frame);

    for (const element of sourceFrame.elements || []) {
      drawElement(frame, element, fonts);
    }

    created.push(frame);
    offsetX += frame.width + gap;
  }

  figma.currentPage.selection = created;
  if (created[0]) figma.viewport.scrollAndZoomIntoView(created);
}

figma.ui.onmessage = async (message) => {
  if (message.type !== 'import') return;

  try {
    const url = `${message.baseUrl}/api/tools/prototype/figma-import?code=${encodeURIComponent(message.code)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '导入码读取失败');

    const spec = data.data.prototypeSpec;
    if (!spec || spec.version !== '1.0') throw new Error('当前插件不支持该原型版本');

    const fonts = await loadFonts();
    drawPrototype(spec, fonts);
    figma.ui.postMessage({ type: 'success', message: '导入完成，已在当前文件生成可编辑图层。' });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '导入失败',
    });
  }
};
