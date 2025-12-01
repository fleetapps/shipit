// export interface CompleteFileObject {
//     filePath: string;
//     fileContents: string;
// }
export class CodeGenerationFormat {
    constructor() {
    }
}
/*

Use familiar shell patterns for multi-file code generation:

FILE CREATION:
# Creating new file: filename.ext
cat > filename.ext << 'EOF'
[file content here]
EOF

UNIFIED DIFF PATCHES:
# Applying diff to file: filename.ext
cat << 'EOF' | patch filename.ext
@@ -1,3 +1,3 @@
 function example() {
-    old line
+    new line
 }
EOF

IMPORTANT RULES:
1. Command-line paths (cat > filename) ALWAYS override comment paths
2. Use single quotes around EOF markers for consistency
3. Ensure proper line endings and EOF markers
4. Large chunks may contain multiple complete files
5. Format supports streaming with partial file updates

This format enables real-time file generation with websocket callbacks for:
- FILE_GENERATING (when file operation starts)
- FILE_CHUNK_GENERATED (for partial content updates)
- FILE_GENERATED (when file is completed)`;
*/ 
