figma.showUI(__html__, { width: 360, height: 300 });

async function loadFonts() {
  const candidates = [
    { family: 'Inter', regular: 'Regular', bold: 'Bold' },
    { family: 'Arial', regular: 'Regular', bold: 'Bold' },
  ];
  for (const candidate of candidates) {
    try {
      await figma.loadFontAsync({ family: candidate.family, style: candidate.regular });
      await figma.loadFontAsync({ family: candidate.family, style: candidate.bold });
      return candidate;
    } catch {
      // Try next font family.
    }
  }
  throw new Error('No supported font found');
}

function hexToRgb(hex, fallback) {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex || '')) return fallback;
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  };
}

function solid(hex, fallback) {
  return { type: 'SOLID', color: hexToRgb(hex, fallback || { r: 1, g: 1, b: 1 }) };
}

function setSolidFill(node, color) {
  node.fills = [{ type: 'SOLID', color }];
}

function setStroke(node, color) {
  node.strokes = [{ type: 'SOLID', color }];
  node.strokeWeight = 1;
}

function gradientPaint(gradient) {
  if (!gradient) return null;
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform:
      gradient.direction === 'horizontal'
        ? [
            [1, 0, 0],
            [0, 1, 0],
          ]
        : [
            [0, 1, 0],
            [-1, 0, 1],
          ],
    gradientStops: [
      { position: 0, color: { ...hexToRgb(gradient.from, { r: 0.1, g: 0.1, b: 0.1 }), a: 1 } },
      ...(gradient.via ? [{ position: 0.5, color: { ...hexToRgb(gradient.via, { r: 0.5, g: 0.5, b: 0.5 }), a: 1 } }] : []),
      { position: 1, color: { ...hexToRgb(gradient.to, { r: 1, g: 1, b: 1 }), a: 1 } },
    ],
  };
}

function applyShadow(node, shadow) {
  const presets = {
    sm: { y: 4, radius: 12, a: 0.08 },
    md: { y: 10, radius: 24, a: 0.12 },
    lg: { y: 18, radius: 42, a: 0.16 },
    glow: { y: 16, radius: 42, a: 0.22, color: { r: 0.07, g: 0.84, b: 0.54 } },
  };
  const preset = presets[shadow];
  if (!preset) return;
  node.effects = [
    {
      type: 'DROP_SHADOW',
      color: { ...(preset.color || { r: 0.06, g: 0.09, b: 0.13 }), a: preset.a },
      offset: { x: 0, y: preset.y },
      radius: preset.radius,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ];
}

function iconGlyph(icon) {
  const icons = {
    home: '⌂',
    search: '⌕',
    music: '♪',
    play: '▶',
    pause: 'Ⅱ',
    next: '›',
    heart: '♡',
    star: '★',
    user: '◍',
    settings: '⚙',
    chart: '#',
    list: '☰',
    image: '▧',
    sparkles: '✦',
    bell: '◔',
    plus: '+',
  };
  return icons[icon] || (icon || '✦').slice(0, 2);
}

function assetGradient(assetRef) {
  const assets = {
    'cover.green-wave': ['#13d78a', '#28f0b2', '#1ba5ff'],
    'cover.night-radio': ['#101820', '#3146ff', '#7c3aed'],
    'cover.sunset': ['#ff7a59', '#ffb84d', '#ffe071'],
    'cover.blueprint': ['#2563eb', '#06b6d4', '#14b8a6'],
    'avatar.member': ['#0f172a', '#475569'],
    'illustration.empty-state': ['#e0f2fe', '#ccfbf1', '#dcfce7'],
  };
  const colors = assets[assetRef] || assets['cover.green-wave'];
  return { from: colors[0], via: colors[1], to: colors[2] || colors[1], direction: 'diagonal' };
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
  text.fills = [solid(element.color || options.color || '#0f172a').color ? solid(element.color || options.color || '#0f172a') : solid('#0f172a')];
  parent.appendChild(text);
  return text;
}

function createBox(parent, element, defaults = {}) {
  const rect = figma.createRectangle();
  rect.name = element.name || element.type;
  rect.x = element.x || 0;
  rect.y = element.y || 0;
  rect.resize(element.width || 120, element.height || 48);
  rect.cornerRadius = element.radius ?? defaults.radius ?? 12;
  const fill = gradientPaint(element.gradient) || solid(element.background, defaults.fill || { r: 1, g: 1, b: 1 });
  rect.fills = [fill];
  setStroke(rect, hexToRgb(element.borderColor, defaults.stroke || { r: 0.87, g: 0.91, b: 0.96 }));
  applyShadow(rect, element.shadow);
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
    { bold: options.bold, fontSize: options.fontSize, color: options.color }
  );
}

function drawElementV1(frame, element, fonts) {
  if (element.type === 'text') {
    createText(frame, element, fonts, { fontSize: element.fontSize || 16 });
    return;
  }

  if (element.type === 'button') {
    createBox(frame, element, { radius: 12, fill: { r: 0.15, g: 0.39, b: 0.92 } });
    createText(frame, { ...element, x: (element.x || 0) + 12, y: (element.y || 0) + 14, width: Math.max(40, (element.width || 120) - 24), height: 24, color: element.color || '#ffffff' }, fonts, { bold: true, fontSize: 14 });
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
      createText(frame, { name: `${element.name || 'item'}-${index + 1}`, text: `• ${item}`, x: (element.x || 0) + 16, y: (element.y || 0) + 44 + index * 22, width: Math.max(40, (element.width || 120) - 32), height: 20, color: '#64748b' }, fonts, { fontSize: 12 });
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
      createText(frame, { name: `${element.name || 'list'}-${index + 1}`, text: item, x: (element.x || 0) + 16, y: (element.y || 0) + 44 + index * 26, width: Math.max(40, (element.width || 120) - 32), height: 22, color: '#334155' }, fonts, { fontSize: 13 });
    });
    return;
  }

  if (element.type === 'tab') {
    createBox(frame, element, { radius: 12, fill: { r: 0.95, g: 0.97, b: 1 } });
    const items = (element.items || ['选项一', '选项二']).slice(0, 4);
    const itemWidth = (element.width || 160) / items.length;
    items.forEach((item, index) => {
      if (index === 0) {
        createBox(frame, { name: `${element.name}-active`, type: 'card', x: (element.x || 0) + 4, y: (element.y || 0) + 4, width: itemWidth - 8, height: (element.height || 44) - 8, background: '#ffffff' }, { radius: 9 });
      }
      createText(frame, { name: `${element.name}-${index + 1}`, text: item, x: (element.x || 0) + index * itemWidth + 8, y: (element.y || 0) + 13, width: itemWidth - 16, height: 20, color: index === 0 ? '#2563eb' : '#64748b' }, fonts, { fontSize: 12 });
    });
    return;
  }

  if (element.type === 'navbar') {
    createBox(frame, element, { radius: 0 });
    appendLabel(frame, element, fonts, { bold: true, yOffset: 22, fontSize: 14 });
  }
}

function createV2Frame(parent, element) {
  const node = figma.createFrame();
  node.name = element.name || element.type;
  node.x = element.x || 0;
  node.y = element.y || 0;
  node.resize(element.width || 120, element.height || 48);
  node.cornerRadius = element.radius ?? 16;
  node.clipsContent = true;
  node.fills = [gradientPaint(element.gradient) || solid(element.background || '#ffffff')];
  node.strokes = element.borderColor ? [solid(element.borderColor)] : [];
  node.strokeWeight = element.borderColor ? 1 : 0;
  if (element.opacity !== undefined) node.opacity = element.opacity;
  applyShadow(node, element.shadow);
  if (element.layout?.mode === 'horizontal' || element.layout?.mode === 'vertical') {
    node.layoutMode = element.layout.mode === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
    node.itemSpacing = element.layout.gap || 8;
    node.paddingLeft = element.layout.paddingX ?? element.layout.padding ?? 0;
    node.paddingRight = element.layout.paddingX ?? element.layout.padding ?? 0;
    node.paddingTop = element.layout.paddingY ?? element.layout.padding ?? 0;
    node.paddingBottom = element.layout.paddingY ?? element.layout.padding ?? 0;
  }
  parent.appendChild(node);
  return node;
}

function drawAssetArt(parent, element, fonts, options = {}) {
  const size = options.size || Math.min(element.width || 96, element.height || 96, 104);
  const art = figma.createFrame();
  art.name = options.name || 'Asset Art';
  art.x = options.x || 0;
  art.y = options.y || 0;
  art.resize(size, size);
  art.cornerRadius = options.radius ?? element.radius ?? 18;
  art.clipsContent = true;
  art.fills = [gradientPaint(assetGradient(element.assetRef))];
  parent.appendChild(art);

  const shine = figma.createEllipse();
  shine.name = 'Highlight';
  shine.x = size * 0.55;
  shine.y = -size * 0.18;
  shine.resize(size * 0.6, size * 0.6);
  shine.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.18 }];
  art.appendChild(shine);

  createText(art, { name: 'Asset Icon', text: iconGlyph(element.icon), x: size / 2 - 12, y: size / 2 - 16, width: 32, height: 32, color: '#ffffff', fontSize: options.iconSize || 24 }, fonts, { bold: true, fontSize: options.iconSize || 24 });
  return art;
}

function drawV2Element(parent, element, fonts) {
  if (element.type === 'text') {
    createText(parent, element, fonts, { bold: (element.fontSize || 14) >= 16, fontSize: element.fontSize || 14 });
    return;
  }

  if (element.type === 'icon') {
    createText(parent, { ...element, text: iconGlyph(element.icon), color: element.color || '#13d78a' }, fonts, { bold: true, fontSize: element.fontSize || 20 });
    return;
  }

  if (element.type === 'image' || element.type === 'imagePlaceholder') {
    const node = createV2Frame(parent, { ...element, gradient: element.gradient || assetGradient(element.assetRef) });
    drawAssetArt(node, { ...element, x: 0, y: 0, width: node.width, height: node.height }, fonts, { size: Math.min(node.width, node.height), radius: element.radius ?? 18 });
    return;
  }

  if (element.type === 'hero') {
    const node = createV2Frame(parent, element);
    createText(node, { name: 'Hero Eyebrow', text: element.items?.[0] || '推荐', x: 20, y: 18, width: node.width - 150, height: 18, color: '#dffff1', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    createText(node, { name: 'Hero Title', text: element.text || element.name, x: 20, y: 44, width: node.width - 150, height: 56, color: '#ffffff', fontSize: 21 }, fonts, { bold: true, fontSize: 21 });
    createBox(node, { name: 'Hero CTA', x: 20, y: node.height - 46, width: 104, height: 30, radius: 15, background: '#ffffff' }, { radius: 15 });
    createText(node, { name: 'Hero CTA Text', text: `${iconGlyph(element.icon)} ${element.items?.[1] || '开始'}`, x: 34, y: node.height - 40, width: 84, height: 18, color: '#0f9d68', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    drawAssetArt(node, { ...element, x: node.width - 118, y: 20 }, fonts, { size: 92, radius: 46, iconSize: 28 });
    return;
  }

  if (element.type === 'navbar') {
    const node = createV2Frame(parent, element);
    createText(node, { name: 'Header Label', text: '高保真原型', x: 16, y: 12, width: 120, height: 16, color: '#667085', fontSize: 11 }, fonts, { fontSize: 11 });
    createText(node, { name: 'Header Title', text: element.text || element.name, x: 16, y: 30, width: node.width - 74, height: 26, color: '#101820', fontSize: 20 }, fonts, { bold: true, fontSize: 20 });
    drawAssetArt(node, { ...element, x: node.width - 52, y: 16 }, fonts, { size: 36, radius: 18, iconSize: 14 });
    createBox(node, { name: 'Search Surface', x: 16, y: node.height - 42, width: node.width - 32, height: 32, radius: 16, background: '#f1f5f9', borderColor: '#e2e8f0' }, { radius: 16 });
    createText(node, { name: 'Search Placeholder', text: `${iconGlyph(element.icon || 'search')} ${element.items?.[0] || '搜索内容'}`, x: 30, y: node.height - 35, width: node.width - 60, height: 18, color: '#667085', fontSize: 12 }, fonts, { fontSize: 12 });
    return;
  }

  if (element.type === 'button') {
    const node = createV2Frame(parent, element);
    createText(node, { name: 'Button Label', text: `${iconGlyph(element.icon)} ${element.text || element.name}`, x: 8, y: element.height / 2 - 9, width: element.width - 16, height: 18, color: element.color || '#ffffff', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    return;
  }

  if (element.type === 'card') {
    const node = createV2Frame(parent, element);
    if (element.assetRef) drawAssetArt(node, { ...element, x: 0, y: 0 }, fonts, { size: Math.min(element.width, 104), radius: element.radius ?? 18 });
    createText(node, { name: 'Card Title', text: element.text || element.name, x: 10, y: element.assetRef ? 112 : 14, width: element.width - 20, height: 34, color: element.color || '#101820', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    if (element.items?.[0]) createText(node, { name: 'Card Meta', text: element.items[0], x: 10, y: element.assetRef ? 142 : 50, width: element.width - 20, height: 14, color: '#667085', fontSize: 10 }, fonts, { fontSize: 10 });
    (element.children || []).forEach((child) => drawV2Element(node, child, fonts));
    return;
  }

  if (element.type === 'list') {
    const node = createV2Frame(parent, element);
    createText(node, { name: 'List Title', text: element.text || element.name, x: 16, y: 12, width: node.width - 32, height: 22, color: '#101820', fontSize: 16 }, fonts, { bold: true, fontSize: 16 });
    (element.items || []).slice(0, 4).forEach((item, index) => {
      const y = 44 + index * 24;
      createText(node, { name: `Rank ${index + 1}`, text: String(index + 1).padStart(2, '0'), x: 16, y, width: 28, height: 18, color: index === 0 ? '#13d78a' : '#94a3b8', fontSize: 13 }, fonts, { bold: true, fontSize: 13 });
      createText(node, { name: `List Item ${index + 1}`, text: item, x: 50, y, width: node.width - 78, height: 18, color: '#101820', fontSize: 12 }, fonts, { fontSize: 12 });
    });
    return;
  }

  if (element.type === 'mediaPlayer') {
    const node = createV2Frame(parent, element);
    drawAssetArt(node, { ...element, x: 10, y: 9 }, fonts, { size: 40, radius: 20, iconSize: 16 });
    createText(node, { name: 'Now Playing', text: element.text || element.name, x: 62, y: 12, width: node.width - 150, height: 18, color: '#ffffff', fontSize: 13 }, fonts, { bold: true, fontSize: 13 });
    createText(node, { name: 'Now Playing Meta', text: element.items?.[0] || '', x: 62, y: 32, width: node.width - 150, height: 14, color: '#bac3cc', fontSize: 10 }, fonts, { fontSize: 10 });
    createText(node, { name: 'Controls', text: `${iconGlyph(element.icon || 'pause')}   ${iconGlyph('next')}`, x: node.width - 72, y: 18, width: 58, height: 22, color: '#ffffff', fontSize: 18 }, fonts, { bold: true, fontSize: 18 });
    return;
  }

  if (element.type === 'bottomNav') {
    const node = createV2Frame(parent, element);
    const items = (element.items || ['首页', '发现', '工具', '我的']).slice(0, 5);
    const icons = ['home', 'search', 'music', 'user', 'settings'];
    const itemWidth = node.width / items.length;
    items.forEach((item, index) => {
      createText(node, { name: `Tab Icon ${item}`, text: iconGlyph(icons[index]), x: index * itemWidth, y: 10, width: itemWidth, height: 20, color: index === 0 ? '#13d78a' : '#8b95a1', fontSize: 17 }, fonts, { bold: true, fontSize: 17 });
      createText(node, { name: `Tab Label ${item}`, text: item, x: index * itemWidth, y: 34, width: itemWidth, height: 14, color: index === 0 ? '#13d78a' : '#8b95a1', fontSize: 10 }, fonts, { fontSize: 10 });
    });
    return;
  }

  if (element.type === 'badge' || element.type === 'stat') {
    const node = createV2Frame(parent, element);
    createText(node, { name: 'Badge Label', text: `${iconGlyph(element.icon)} ${element.text || element.name}`, x: 14, y: element.height / 2 - 9, width: element.width - 28, height: 18, color: element.color || '#0f766e', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    return;
  }

  if (element.type === 'divider') {
    createBox(parent, element, { radius: 0, fill: { r: 0.89, g: 0.91, b: 0.94 } });
    return;
  }

  const node = createV2Frame(parent, element);
  appendLabel(node, { ...element, x: 0, y: 0 }, fonts, { bold: true, fontSize: 14 });
  (element.children || []).forEach((child) => drawV2Element(node, child, fonts));
}

function drawPrototypeV1(spec, fonts) {
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

    for (const element of sourceFrame.elements || []) drawElementV1(frame, element, fonts);

    created.push(frame);
    offsetX += frame.width + gap;
  }

  return created;
}

function drawPrototypeV2(spec, fonts) {
  const created = [];
  const gap = 96;
  let offsetX = figma.viewport.center.x - (spec.frames[0]?.width || 390) / 2;

  for (const sourceFrame of spec.frames || []) {
    const frame = figma.createFrame();
    frame.name = sourceFrame.name || spec.name || 'PM Hub Prototype v2';
    frame.x = offsetX;
    frame.y = figma.viewport.center.y - (sourceFrame.height || 844) / 2;
    frame.resize(sourceFrame.width || spec.canvas.width, sourceFrame.height || spec.canvas.height);
    frame.cornerRadius = frame.width < 500 ? 34 : 24;
    frame.clipsContent = true;
    frame.fills = [gradientPaint(sourceFrame.background?.gradient) || solid(sourceFrame.background?.color || '#effff7')];
    figma.currentPage.appendChild(frame);

    const glow = figma.createEllipse();
    glow.name = 'Ambient Glow';
    glow.x = frame.width - 160;
    glow.y = -120;
    glow.resize(280, 280);
    glow.fills = [{ type: 'SOLID', color: hexToRgb('#13d78a', { r: 0.07, g: 0.84, b: 0.54 }), opacity: 0.16 }];
    frame.appendChild(glow);

    for (const element of sourceFrame.elements || []) drawV2Element(frame, element, fonts);

    created.push(frame);
    offsetX += frame.width + gap;
  }

  return created;
}

function drawPrototype(spec, fonts) {
  const created = spec.version === '2.0' ? drawPrototypeV2(spec, fonts) : drawPrototypeV1(spec, fonts);
  figma.currentPage.selection = created;
  if (created[0]) figma.viewport.scrollAndZoomIntoView(created);
  return created;
}

figma.ui.onmessage = async (message) => {
  if (message.type !== 'import') return;

  try {
    const url = `${message.baseUrl}/api/tools/prototype/figma-import?code=${encodeURIComponent(message.code)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '导入码读取失败');

    const spec = data.data.prototypeSpec;
    if (!spec || !['1.0', '2.0'].includes(spec.version)) throw new Error('当前插件不支持该原型版本');

    const fonts = await loadFonts();
    const created = drawPrototype(spec, fonts);
    const warnings = (spec.frames || []).flatMap((frame) => frame.validation || []);
    figma.ui.postMessage({
      type: 'success',
      message: `导入完成，已生成 ${created.length} 个画板${warnings.length ? `，包含 ${warnings.length} 条校验提示` : ''}。`,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '导入失败',
    });
  }
};
