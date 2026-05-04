const fs = require('fs');
const path = require('path');

const emojiMap = {
  '👋': 'MdWavingHand',
  '📍': 'MdLocationOn',
  '🕐': 'MdAccessTime',
  '🕑': 'MdWatchLater',
  '📱': 'MdQrCodeScanner',
  '👨‍👩‍👧‍👦': 'MdFamilyRestroom',
  '🎓': 'MdSchool',
  '📊': 'MdInsertChart',
  '✅': 'MdCheckCircle',
  '⏰': 'MdAlarm',
  '💊': 'MdLocalHospital',
  '📋': 'MdAssignment',
  '❌': 'MdCancel',
  '🎯': 'MdTrackChanges',
  '📭': 'MdInbox',
  '👨‍🏫': 'MdPersonOutline',
  '🏫': 'MdBusiness',
  '✏️': 'MdEditDocument',
  '📈': 'MdInsertChartOutlined',
  '💾': 'MdSave',
  '👥': 'MdGroup',
  '📅': 'MdCalendarMonth',
  '📷': 'MdPhotoCamera',
  '📹': 'MdVideocam',
  '🟢': 'MdCheckCircle',
  '🔴': 'MdCancel',
  '🔄': 'MdRefresh',
  '▶️': 'MdPlayArrow'
};

const emojiRegex = new RegExp(`(${Object.keys(emojiMap).join('|')})`, 'gu');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let iconsUsed = new Set();
  
  let newContent = content.replace(emojiRegex, (match) => {
    let iconName = emojiMap[match];
    iconsUsed.add(iconName);
    
    // Add styling logic based on the context if possible, but for simplicity:
    // Some icons need styling like flex items-center
    // Here we just replace the emoji with the component string
    if (match === '👋') return `<${iconName} className="text-yellow-500 inline" />`;
    if (match === '🟢') return `<${iconName} className="text-green-500 inline" />`;
    if (match === '🔴') return `<${iconName} className="text-red-500 inline" />`;
    
    // If it's inside a stat-icon or empty-state__icon, we might want to make it larger
    return `<${iconName} className="inline-block" />`;
  });

  if (iconsUsed.size > 0 && content !== newContent) {
    // Add import statement at the top (after other imports)
    const importStr = `import { ${Array.from(iconsUsed).join(', ')} } from 'react-icons/md';\n`;
    
    // Find last import
    const lastImportIndex = newContent.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = newContent.indexOf('\n', lastImportIndex);
      newContent = newContent.substring(0, endOfLine + 1) + importStr + newContent.substring(endOfLine + 1);
    } else {
      newContent = importStr + newContent;
    }
    
    // Add basic gap-2 to headers and buttons containing these icons if needed
    newContent = newContent.replace(/<h[1-6][^>]*>(.*?)<Md/g, (match) => {
       if (!match.includes('className=')) {
          return match.replace(/<h([1-6])/, '<h$1 className="flex items-center gap-2"');
       }
       return match;
    });

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  let files = fs.readdirSync(dir);
  files.forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (f.endsWith('.jsx')) {
      processFile(p);
    }
  });
}

walk('./src/pages');
