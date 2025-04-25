const fs = require('fs');
const path = require('path');

// Path to the node_modules file that needs patching
const targetPath = path.resolve(
  __dirname,
  'node_modules',
  '@project-serum',
  'anchor',
  'dist',
  'cjs',
  'coder',
  'borsh',
  'index.js'
);

// Additional Anchor files to check
const additionalFiles = [
  path.resolve(__dirname, 'node_modules', '@project-serum', 'anchor', 'dist', 'cjs', 'coder', 'index.js'),
  path.resolve(__dirname, 'node_modules', '@project-serum', 'anchor', 'dist', 'cjs', 'coder', 'event.js'),
  path.resolve(__dirname, 'node_modules', '@project-serum', 'anchor', 'dist', 'cjs', 'program', 'index.js')
];

// The exact file where the error is occurring
const eventJsPath = path.resolve(
  __dirname,
  'node_modules',
  '@project-serum',
  'anchor',
  'dist',
  'cjs',
  'coder',
  'borsh',
  'event.js'
);

try {
  console.log('Patching Anchor files...');
  
  // First, fix the main file
  let content = fs.readFileSync(targetPath, 'utf8');
  let originalContent = content;
  
  // Add safety checks for undefined arrays
  content = content.replace(
    'this.eventLayouts = eventParser',
    'this.eventLayouts = eventParser || []'
  );

  content = content.replace(
    'this.items = this.layouts.map',
    'this.items = (this.layouts || []).map'
  );
  
  // Fix additional potential issues
  content = content.replace(
    /(\w+)\.map\(/g, 
    '($1 || []).map('
  );

  if (content !== originalContent) {
    fs.writeFileSync(targetPath, content);
    console.log(`✅ Patched ${targetPath}`);
  } else {
    console.log(`⚠️ No changes made to ${targetPath}`);
  }
  
  // Check additional files
  for (const file of additionalFiles) {
    if (fs.existsSync(file)) {
      console.log(`Checking ${file}...`);
      let fileContent = fs.readFileSync(file, 'utf8');
      let originalFileContent = fileContent;
      
      // Add safeguards for any .map calls
      fileContent = fileContent.replace(
        /(\w+)\.map\(/g, 
        '($1 || []).map('
      );
      
      // Specific fix for BorshEventCoder
      if (file.includes('event.js')) {
        fileContent = fileContent.replace(
          'constructor(eventParser)',
          'constructor(eventParser) { eventParser = eventParser || []; '
        );
      }
      
      if (fileContent !== originalFileContent) {
        fs.writeFileSync(file, fileContent);
        console.log(`✅ Patched ${file}`);
      } else {
        console.log(`ℹ️ No changes needed for ${file}`);
      }
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  }
  
  console.log('✅ Anchor patch applied successfully!');

  console.log('Patching Anchor event.js file...');

  // Check if file exists
  if (!fs.existsSync(eventJsPath)) {
    throw new Error(`File not found: ${eventJsPath}`);
  }
  
  // Read the file
  content = fs.readFileSync(eventJsPath, 'utf8');
  originalContent = content;
  
  // Fix line 37: idl.events.map -> (idl.events || []).map
  content = content.replace(
    'const layouts = idl.events.map((event) => {',
    'const layouts = (idl.events || []).map((event) => {'
  );
  
  // Fix line 42: event.fields.map -> (event.fields || []).map
  content = content.replace(
    'fields: event.fields.map((f) => {',
    'fields: (event.fields || []).map((f) => {'
  );
  
  // Fix line 52: idl.events.map -> (idl.events || []).map
  content = content.replace(
    ': idl.events.map((e) => [',
    ': (idl.events || []).map((e) => ['
  );
  
  // Add safety check at the beginning of the BorshEventCoder constructor
  content = content.replace(
    'constructor(eventParser) {',
    'constructor(eventParser) { eventParser = eventParser || []; '
  );
  
  // Check if we made any changes
  if (content !== originalContent) {
    fs.writeFileSync(eventJsPath, content);
    console.log(`✅ Successfully patched ${eventJsPath}`);
  } else {
    console.log(`⚠️ No changes made to ${eventJsPath}`);
    
    // Get more info about the file to understand what we're dealing with
    console.log('\nFirst 100 characters of the file:');
    console.log(originalContent.substring(0, 100));
    
    // Try to load more information about the constructor
    const constructorMatch = originalContent.match(/constructor\([^)]*\)\s*{[^}]*}/);
    if (constructorMatch) {
      console.log('\nConstructor found:');
      console.log(constructorMatch[0]);
    }
  }
  
  console.log('\nPatching complete!');
} catch (err) {
  console.error('Error applying Anchor patch:', err);
} 