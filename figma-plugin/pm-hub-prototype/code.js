figma.showUI(__html__, { width: 360, height: 300 });

function assign(target, source) {
  var result = {};
  var key;
  for (key in target) result[key] = target[key];
  for (key in source) result[key] = source[key];
  return result;
}

function valueOr(value, fallback) {
  return value === undefined || value === null ? fallback : value;
}

function clampText(text, width, height, fontSize) {
  var source = String(text || '');
  var size = fontSize || 14;
  var hasWideChars = /[^\x00-\x7F]/.test(source);
  var charWidth = hasWideChars ? size * 1.02 : size * 0.58;
  var charsPerLine = Math.max(4, Math.floor((width || 120) / charWidth));
  var lines = Math.max(1, Math.floor((height || 24) / (size * 1.35)));
  var maxChars = Math.max(4, charsPerLine * lines);
  return source.length > maxChars ? source.slice(0, Math.max(1, maxChars - 3)) + '...' : source;
}

async function loadFonts() {
  var candidates = [
    { family: 'Inter', regular: 'Regular', bold: 'Bold' },
    { family: 'Arial', regular: 'Regular', bold: 'Bold' },
  ];

  for (var i = 0; i < candidates.length; i += 1) {
    var candidate = candidates[i];
    try {
      await figma.loadFontAsync({ family: candidate.family, style: candidate.regular });
      await figma.loadFontAsync({ family: candidate.family, style: candidate.bold });
      return candidate;
    } catch (error) {
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
  node.fills = [{ type: 'SOLID', color: color }];
}

function setStroke(node, color) {
  node.strokes = [{ type: 'SOLID', color: color }];
  node.strokeWeight = 1;
}

function gradientPaint(gradient) {
  if (!gradient) return null;

  var stops = [
    { position: 0, color: assign(hexToRgb(gradient.from, { r: 0.1, g: 0.1, b: 0.1 }), { a: 1 }) },
  ];
  if (gradient.via) {
    stops.push({ position: 0.5, color: assign(hexToRgb(gradient.via, { r: 0.5, g: 0.5, b: 0.5 }), { a: 1 }) });
  }
  stops.push({ position: 1, color: assign(hexToRgb(gradient.to, { r: 1, g: 1, b: 1 }), { a: 1 }) });

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
    gradientStops: stops,
  };
}

function applyShadow(node, shadow) {
  var presets = {
    sm: { y: 4, radius: 12, a: 0.08 },
    md: { y: 10, radius: 24, a: 0.12 },
    lg: { y: 18, radius: 42, a: 0.16 },
    glow: { y: 16, radius: 42, a: 0.22, color: { r: 0.07, g: 0.84, b: 0.54 } },
  };
  var preset = presets[shadow];
  if (!preset) return;
  node.effects = [
    {
      type: 'DROP_SHADOW',
      color: assign(preset.color || { r: 0.06, g: 0.09, b: 0.13 }, { a: preset.a }),
      offset: { x: 0, y: preset.y },
      radius: preset.radius,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ];
}

function iconGlyph(icon) {
  var icons = {
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
  return icons[icon] || String(icon || '✦').slice(0, 2);
}

function assetGradient(assetRef) {
  var assets = {
    'cover.green-wave': ['#13d78a', '#28f0b2', '#1ba5ff'],
    'cover.night-radio': ['#101820', '#3146ff', '#7c3aed'],
    'cover.sunset': ['#ff7a59', '#ffb84d', '#ffe071'],
    'cover.blueprint': ['#2563eb', '#06b6d4', '#14b8a6'],
    'avatar.member': ['#0f172a', '#475569'],
    'illustration.empty-state': ['#e0f2fe', '#ccfbf1', '#dcfce7'],
  };
  var colors = assets[assetRef] || assets['cover.green-wave'];
  return { from: colors[0], via: colors[1], to: colors[2] || colors[1], direction: 'diagonal' };
}

function createText(parent, element, fonts, options) {
  options = options || {};
  var text = figma.createText();
  text.name = element.name || 'Text';
  text.x = element.x || 0;
  text.y = element.y || 0;
  text.resize(element.width || 120, element.height || 32);
  text.fontName = { family: fonts.family, style: options.bold ? fonts.bold : fonts.regular };
  text.fontSize = element.fontSize || options.fontSize || 14;
  text.characters = clampText(element.text || element.name || '', element.width || 120, element.height || 32, text.fontSize);
  text.textAutoResize = 'NONE';
  text.fills = [solid(element.color || options.color || '#0f172a')];
  parent.appendChild(text);
  return text;
}

function createBox(parent, element, defaults) {
  defaults = defaults || {};
  var rect = figma.createRectangle();
  rect.name = element.name || element.type || 'Box';
  rect.x = element.x || 0;
  rect.y = element.y || 0;
  rect.resize(element.width || 120, element.height || 48);
  rect.cornerRadius = valueOr(element.radius, valueOr(defaults.radius, 12));
  rect.fills = [gradientPaint(element.gradient) || solid(element.background, defaults.fill || { r: 1, g: 1, b: 1 })];
  setStroke(rect, hexToRgb(element.borderColor, defaults.stroke || { r: 0.87, g: 0.91, b: 0.96 }));
  applyShadow(rect, element.shadow);
  parent.appendChild(rect);
  return rect;
}

function appendLabel(parent, element, fonts, options) {
  options = options || {};
  if (!element.text && !element.name) return;
  createText(
    parent,
    assign(element, {
      x: (element.x || 0) + (options.xOffset || 14),
      y: (element.y || 0) + (options.yOffset || 14),
      width: Math.max(40, (element.width || 120) - 28),
      height: Math.max(20, (element.height || 48) - 20),
      text: element.text || element.name,
    }),
    fonts,
    { bold: options.bold, fontSize: options.fontSize, color: options.color }
  );
}

function drawElementV1(frame, element, fonts) {
  var i;
  if (element.type === 'text') {
    createText(frame, element, fonts, { fontSize: element.fontSize || 16 });
    return;
  }

  if (element.type === 'button') {
    createBox(frame, element, { radius: 12, fill: { r: 0.15, g: 0.39, b: 0.92 } });
    createText(
      frame,
      assign(element, {
        x: (element.x || 0) + 12,
        y: (element.y || 0) + 14,
        width: Math.max(40, (element.width || 120) - 24),
        height: 24,
        color: element.color || '#ffffff',
      }),
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
    var cardItems = (element.items || []).slice(0, 5);
    for (i = 0; i < cardItems.length; i += 1) {
      createText(
        frame,
        {
          name: (element.name || 'item') + '-' + (i + 1),
          text: '• ' + cardItems[i],
          x: (element.x || 0) + 16,
          y: (element.y || 0) + 44 + i * 22,
          width: Math.max(40, (element.width || 120) - 32),
          height: 20,
          color: '#64748b',
        },
        fonts,
        { fontSize: 12 }
      );
    }
    return;
  }

  if (element.type === 'imagePlaceholder') {
    createBox(frame, element, { radius: 16, fill: { r: 0.95, g: 0.97, b: 1 } });
    appendLabel(frame, assign(element, { text: element.text || '图片占位' }), fonts, { fontSize: 12 });
    return;
  }

  if (element.type === 'list') {
    createBox(frame, element, { radius: 16 });
    appendLabel(frame, element, fonts, { bold: true, fontSize: 14 });
    var listItems = (element.items || ['列表项一', '列表项二', '列表项三']).slice(0, 6);
    for (i = 0; i < listItems.length; i += 1) {
      createText(
        frame,
        {
          name: (element.name || 'list') + '-' + (i + 1),
          text: listItems[i],
          x: (element.x || 0) + 16,
          y: (element.y || 0) + 44 + i * 26,
          width: Math.max(40, (element.width || 120) - 32),
          height: 22,
          color: '#334155',
        },
        fonts,
        { fontSize: 13 }
      );
    }
    return;
  }

  if (element.type === 'tab') {
    createBox(frame, element, { radius: 12, fill: { r: 0.95, g: 0.97, b: 1 } });
    var tabItems = (element.items || ['选项一', '选项二']).slice(0, 4);
    var itemWidth = (element.width || 160) / tabItems.length;
    for (i = 0; i < tabItems.length; i += 1) {
      if (i === 0) {
        createBox(
          frame,
          { name: element.name + '-active', type: 'card', x: (element.x || 0) + 4, y: (element.y || 0) + 4, width: itemWidth - 8, height: (element.height || 44) - 8, background: '#ffffff' },
          { radius: 9 }
        );
      }
      createText(
        frame,
        { name: element.name + '-' + (i + 1), text: tabItems[i], x: (element.x || 0) + i * itemWidth + 8, y: (element.y || 0) + 13, width: itemWidth - 16, height: 20, color: i === 0 ? '#2563eb' : '#64748b' },
        fonts,
        { fontSize: 12 }
      );
    }
    return;
  }

  if (element.type === 'navbar') {
    createBox(frame, element, { radius: 0 });
    appendLabel(frame, element, fonts, { bold: true, yOffset: 22, fontSize: 14 });
    return;
  }

  createBox(frame, element, { radius: 12, fill: { r: 0.98, g: 0.98, b: 0.98 } });
  appendLabel(frame, assign(element, { text: '不支持的元素: ' + element.type }), fonts, { fontSize: 12, color: '#dc2626' });
}

function createV2Frame(parent, element) {
  var node = figma.createFrame();
  node.name = element.name || element.type || 'Frame';
  node.x = element.x || 0;
  node.y = element.y || 0;
  node.resize(element.width || 120, element.height || 48);
  node.cornerRadius = valueOr(element.radius, 16);
  node.clipsContent = true;
  node.fills = [gradientPaint(element.gradient) || solid(element.background || '#ffffff')];
  node.strokes = element.borderColor ? [solid(element.borderColor)] : [];
  node.strokeWeight = element.borderColor ? 1 : 0;
  if (element.opacity !== undefined) node.opacity = element.opacity;
  applyShadow(node, element.shadow);

  if (element.layout && (element.layout.mode === 'horizontal' || element.layout.mode === 'vertical')) {
    node.layoutMode = element.layout.mode === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
    node.itemSpacing = element.layout.gap || 8;
    node.paddingLeft = valueOr(element.layout.paddingX, valueOr(element.layout.padding, 0));
    node.paddingRight = valueOr(element.layout.paddingX, valueOr(element.layout.padding, 0));
    node.paddingTop = valueOr(element.layout.paddingY, valueOr(element.layout.padding, 0));
    node.paddingBottom = valueOr(element.layout.paddingY, valueOr(element.layout.padding, 0));
  }

  parent.appendChild(node);
  return node;
}

function drawAssetArt(parent, element, fonts, options) {
  options = options || {};
  var size = options.size || Math.min(element.width || 96, element.height || 96, 104);
  var art = figma.createFrame();
  art.name = options.name || 'Asset Art';
  art.x = valueOr(options.x, element.x || 0);
  art.y = valueOr(options.y, element.y || 0);
  art.resize(size, size);
  art.cornerRadius = valueOr(options.radius, valueOr(element.radius, 18));
  art.clipsContent = true;
  art.fills = [gradientPaint(assetGradient(element.assetRef))];
  parent.appendChild(art);

  var shine = figma.createEllipse();
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
  var i;
  if (element.type === 'text') {
    createText(parent, element, fonts, { bold: (element.fontSize || 14) >= 16, fontSize: element.fontSize || 14 });
    return;
  }

  if (element.type === 'section' || element.type === 'frame') {
    var section = createV2Frame(parent, element);
    var sectionChildren = element.children || [];
    if (sectionChildren.length === 0 && element.text) {
      createText(section, { name: element.name + ' Label', text: element.text, x: 14, y: 12, width: element.width - 28, height: 22, color: element.color || '#101820', fontSize: 14 }, fonts, { bold: true, fontSize: 14 });
    }
    for (i = 0; i < sectionChildren.length; i += 1) drawV2Element(section, sectionChildren[i], fonts);
    return;
  }

  if (element.type === 'icon') {
    createText(parent, assign(element, { text: iconGlyph(element.icon), color: element.color || '#13d78a' }), fonts, { bold: true, fontSize: element.fontSize || 20 });
    return;
  }

  if (element.type === 'image' || element.type === 'imagePlaceholder') {
    var imageNode = createV2Frame(parent, assign(element, { gradient: element.gradient || assetGradient(element.assetRef) }));
    drawAssetArt(imageNode, assign(element, { x: 0, y: 0, width: imageNode.width, height: imageNode.height }), fonts, { size: Math.min(imageNode.width, imageNode.height), radius: valueOr(element.radius, 18) });
    return;
  }

  if (element.type === 'hero') {
    var hero = createV2Frame(parent, element);
    createText(hero, { name: 'Hero Eyebrow', text: (element.items && element.items[0]) || '推荐', x: 20, y: 18, width: hero.width - 150, height: 18, color: '#dffff1', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    createText(hero, { name: 'Hero Title', text: element.text || element.name, x: 20, y: 44, width: hero.width - 150, height: 56, color: '#ffffff', fontSize: 21 }, fonts, { bold: true, fontSize: 21 });
    createBox(hero, { name: 'Hero CTA', x: 20, y: hero.height - 46, width: 104, height: 30, radius: 15, background: '#ffffff' }, { radius: 15 });
    createText(hero, { name: 'Hero CTA Text', text: iconGlyph(element.icon) + ' ' + ((element.items && element.items[1]) || '开始'), x: 34, y: hero.height - 40, width: 84, height: 18, color: '#0f9d68', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    drawAssetArt(hero, assign(element, { x: hero.width - 118, y: 20 }), fonts, { size: 92, radius: 46, iconSize: 28 });
    return;
  }

  if (element.type === 'navbar') {
    var nav = createV2Frame(parent, element);
    createText(nav, { name: 'Header Label', text: '中保真原型', x: 16, y: 12, width: 120, height: 16, color: '#667085', fontSize: 11 }, fonts, { fontSize: 11 });
    createText(nav, { name: 'Header Title', text: element.text || element.name, x: 16, y: 30, width: nav.width - 74, height: 26, color: '#101820', fontSize: 20 }, fonts, { bold: true, fontSize: 20 });
    drawAssetArt(nav, assign(element, { x: nav.width - 52, y: 16 }), fonts, { size: 36, radius: 18, iconSize: 14 });
    return;
  }

  if (element.type === 'button') {
    var button = createV2Frame(parent, element);
    if (element.width <= 90 && element.height >= 56) {
      createText(button, { name: 'Button Icon', text: iconGlyph(element.icon), x: 0, y: 14, width: element.width, height: 18, color: element.color || '#ffffff', fontSize: 14 }, fonts, { bold: true, fontSize: 14 });
      createText(button, { name: 'Button Label', text: element.text || element.name, x: 8, y: 38, width: element.width - 16, height: 16, color: element.color || '#ffffff', fontSize: 10 }, fonts, { bold: true, fontSize: 10 });
    } else {
      createText(button, { name: 'Button Label', text: iconGlyph(element.icon) + ' ' + (element.text || element.name), x: 8, y: element.height / 2 - 9, width: element.width - 16, height: 18, color: element.color || '#ffffff', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    }
    return;
  }

  if (element.type === 'card') {
    var card = createV2Frame(parent, element);
    var artSize = Math.min(element.width - 18, element.height > 148 ? 92 : 84);
    if (element.assetRef) drawAssetArt(card, assign(element, { x: 9, y: 8 }), fonts, { size: artSize, radius: valueOr(element.radius, 18) });
    createText(card, { name: 'Card Title', text: element.text || element.name, x: 10, y: element.assetRef ? artSize + 16 : 14, width: element.width - 20, height: 30, color: element.color || '#101820', fontSize: 11 }, fonts, { bold: true, fontSize: 11 });
    if (element.items && element.items[0]) createText(card, { name: 'Card Meta', text: element.items[0], x: 10, y: element.assetRef ? artSize + 48 : 50, width: element.width - 20, height: 14, color: '#667085', fontSize: 9 }, fonts, { fontSize: 9 });
    var children = element.children || [];
    for (i = 0; i < children.length; i += 1) drawV2Element(card, children[i], fonts);
    return;
  }

  if (element.type === 'list') {
    var list = createV2Frame(parent, element);
    createText(list, { name: 'List Title', text: element.text || element.name, x: 16, y: 12, width: list.width - 32, height: 22, color: '#101820', fontSize: 16 }, fonts, { bold: true, fontSize: 16 });
    var items = (element.items || []).slice(0, 4);
    for (i = 0; i < items.length; i += 1) {
      var y = 44 + i * 24;
      createText(list, { name: 'Rank ' + (i + 1), text: String(i + 1), x: 16, y: y, width: 28, height: 18, color: i === 0 ? '#13d78a' : '#94a3b8', fontSize: 13 }, fonts, { bold: true, fontSize: 13 });
      createText(list, { name: 'List Item ' + (i + 1), text: items[i], x: 50, y: y, width: list.width - 78, height: 18, color: '#101820', fontSize: 12 }, fonts, { fontSize: 12 });
    }
    return;
  }

  if (element.type === 'mediaPlayer') {
    var player = createV2Frame(parent, element);
    drawAssetArt(player, assign(element, { x: 10, y: 9 }), fonts, { size: 40, radius: 20, iconSize: 16 });
    createText(player, { name: 'Now Playing', text: element.text || element.name, x: 62, y: 12, width: player.width - 150, height: 18, color: '#ffffff', fontSize: 13 }, fonts, { bold: true, fontSize: 13 });
    createText(player, { name: 'Now Playing Meta', text: (element.items && element.items[0]) || '', x: 62, y: 32, width: player.width - 150, height: 14, color: '#bac3cc', fontSize: 10 }, fonts, { fontSize: 10 });
    createText(player, { name: 'Controls', text: iconGlyph(element.icon || 'pause') + '   ' + iconGlyph('next'), x: player.width - 72, y: 18, width: 58, height: 22, color: '#ffffff', fontSize: 18 }, fonts, { bold: true, fontSize: 18 });
    return;
  }

  if (element.type === 'bottomNav') {
    var bottomNav = createV2Frame(parent, element);
    var navItems = (element.items || ['首页', '发现', '工具', '我的']).slice(0, 5);
    var icons = ['home', 'search', 'music', 'user', 'settings'];
    var itemWidth = bottomNav.width / navItems.length;
    for (i = 0; i < navItems.length; i += 1) {
      createText(bottomNav, { name: 'Tab Icon ' + navItems[i], text: iconGlyph(icons[i]), x: i * itemWidth, y: 10, width: itemWidth, height: 20, color: i === 0 ? '#13d78a' : '#8b95a1', fontSize: 17 }, fonts, { bold: true, fontSize: 17 });
      createText(bottomNav, { name: 'Tab Label ' + navItems[i], text: navItems[i], x: i * itemWidth, y: 34, width: itemWidth, height: 14, color: i === 0 ? '#13d78a' : '#8b95a1', fontSize: 10 }, fonts, { fontSize: 10 });
    }
    return;
  }

  if (element.type === 'badge' || element.type === 'stat') {
    var badge = createV2Frame(parent, element);
    createText(badge, { name: 'Badge Label', text: iconGlyph(element.icon) + ' ' + (element.text || element.name), x: 14, y: element.height / 2 - 9, width: element.width - 28, height: 18, color: element.color || '#0f766e', fontSize: 12 }, fonts, { bold: true, fontSize: 12 });
    return;
  }

  if (element.type === 'divider') {
    createBox(parent, element, { radius: 0, fill: { r: 0.89, g: 0.91, b: 0.94 } });
    return;
  }

  var node = createV2Frame(parent, element);
  appendLabel(node, assign(element, { x: 0, y: 0 }), fonts, { bold: true, fontSize: 14 });
  var fallbackChildren = element.children || [];
  for (i = 0; i < fallbackChildren.length; i += 1) drawV2Element(node, fallbackChildren[i], fonts);
}

function drawPrototypeV1(spec, fonts) {
  var created = [];
  var gap = 80;
  var firstFrame = spec.frames && spec.frames[0];
  var offsetX = figma.viewport.center.x - ((firstFrame && firstFrame.width) || 390) / 2;
  var frames = spec.frames || [];

  for (var i = 0; i < frames.length; i += 1) {
    var sourceFrame = frames[i];
    var frame = figma.createFrame();
    frame.name = sourceFrame.name || spec.name || 'PM Hub Prototype';
    frame.x = offsetX;
    frame.y = figma.viewport.center.y - (sourceFrame.height || 844) / 2;
    frame.resize(sourceFrame.width || spec.canvas.width, sourceFrame.height || spec.canvas.height);
    frame.cornerRadius = 0;
    setSolidFill(frame, { r: 0.97, g: 0.98, b: 1 });
    figma.currentPage.appendChild(frame);

    var elements = sourceFrame.elements || [];
    for (var j = 0; j < elements.length; j += 1) drawElementV1(frame, elements[j], fonts);

    created.push(frame);
    offsetX += frame.width + gap;
  }

  return created;
}

function drawPrototypeV2(spec, fonts) {
  var created = [];
  var gap = 96;
  var firstFrame = spec.frames && spec.frames[0];
  var offsetX = figma.viewport.center.x - ((firstFrame && firstFrame.width) || 390) / 2;
  var frames = spec.frames || [];

  for (var i = 0; i < frames.length; i += 1) {
    var sourceFrame = frames[i];
    var frame = figma.createFrame();
    frame.name = sourceFrame.name || spec.name || 'PM Hub Prototype v2';
    frame.x = offsetX;
    frame.y = figma.viewport.center.y - (sourceFrame.height || 844) / 2;
    frame.resize(sourceFrame.width || spec.canvas.width, sourceFrame.height || spec.canvas.height);
    frame.cornerRadius = frame.width < 500 ? 34 : 24;
    frame.clipsContent = true;
    var background = sourceFrame.background || {};
    frame.fills = [gradientPaint(background.gradient) || solid(background.color || '#effff7')];
    figma.currentPage.appendChild(frame);

    var elements = sourceFrame.elements || [];
    for (var j = 0; j < elements.length; j += 1) drawV2Element(frame, elements[j], fonts);

    created.push(frame);
    offsetX += frame.width + gap;
  }

  return created;
}

function drawPrototype(spec, fonts) {
  var created = spec.version === '2.0' ? drawPrototypeV2(spec, fonts) : drawPrototypeV1(spec, fonts);
  figma.currentPage.selection = created;
  if (created[0]) figma.viewport.scrollAndZoomIntoView(created);
  return created;
}

function countWarnings(spec) {
  var count = 0;
  var frames = spec.frames || [];
  for (var i = 0; i < frames.length; i += 1) {
    count += (frames[i].validation || []).length;
  }
  return count;
}

figma.ui.onmessage = async function (message) {
  if (message.type !== 'import') return;

  try {
    var url = message.baseUrl + '/api/tools/prototype/figma-import?code=' + encodeURIComponent(message.code);
    var res = await fetch(url);
    var data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '导入码读取失败');

    var spec = data.data.prototypeSpec;
    if (!spec || (spec.version !== '1.0' && spec.version !== '2.0')) throw new Error('当前插件不支持该原型版本');

    var fonts = await loadFonts();
    var created = drawPrototype(spec, fonts);
    var warnings = countWarnings(spec);
    figma.ui.postMessage({
      type: 'success',
      message: '导入完成，已生成 ' + created.length + ' 个画板' + (warnings ? '，包含 ' + warnings + ' 条校验提示' : '') + '。',
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error && error.message ? error.message : '导入失败',
    });
  }
};
