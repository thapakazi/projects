#!/usr/bin/env bash
# Generate index.html with tree-view listing of all projects
# Scans directories and enriches with descriptions from README.md

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$REPO_ROOT}"
cd "$OUT_DIR" || exit 1

# Get all project directories (excluding hidden, scripts, .github, _site)
projects=()
for dir in */; do
    name="${dir%/}"
    if [[ "$name" != "scripts" && "$name" != ".github" && "$name" != "_site" && -d "$dir" ]]; then
        projects+=("$name")
    fi
done

# Sort projects
IFS=$'\n' projects=($(sort <<<"${projects[*]}")); unset IFS

# Function to get description for a project from README.md
get_description() {
    local proj="$1"
    if [[ -f "$REPO_ROOT/README.md" ]]; then
        grep -E "^\- \[$proj\]" "$REPO_ROOT/README.md" | sed -E 's/^.*\) - (.+)$/\1/' | head -1
    fi
}

# Generate HTML
cat > index.html << 'HEADER'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>projects.thapakazi.com</title>
    <style>
        body {
            font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
            background: #1a1a2e;
            color: #eee;
            padding: 2rem;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            color: #00d9ff;
            font-weight: normal;
            margin-bottom: 2rem;
        }
        .tree {
            font-size: 1.1rem;
        }
        .tree-line {
            color: #666;
        }
        .tree a {
            color: #7ee787;
            text-decoration: none;
        }
        .tree a:hover {
            text-decoration: underline;
        }
        .root {
            color: #f0883e;
        }
        .desc {
            color: #666;
            font-size: 0.85rem;
        }
        .disclaimer {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 2rem;
        }
        .disclaimer a {
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>~/projects</h1>
        <p class="disclaimer">test projects built with LLMs, nothing fancy. <a href="https://github.com/thapakazi/projects">view source</a></p>
        <div class="tree">
            <div class="root">projects/</div>
HEADER

# Add each project to tree
count=${#projects[@]}
for i in "${!projects[@]}"; do
    name="${projects[$i]}"
    desc=$(get_description "$name")
    if [[ $i -eq $((count - 1)) ]]; then
        prefix="└──"
    else
        prefix="├──"
    fi
    if [[ -n "$desc" ]]; then
        echo "            <div><span class=\"tree-line\">$prefix</span> <a href=\"./$name/index.html\">$name/</a> <span class=\"desc\">- $desc</span></div>" >> index.html
    else
        echo "            <div><span class=\"tree-line\">$prefix</span> <a href=\"./$name/index.html\">$name/</a></div>" >> index.html
    fi
done

cat >> index.html << 'FOOTER'
        </div>
    </div>
</body>
</html>
FOOTER

echo "Generated index.html with ${#projects[@]} projects"

# Inject navigation header into each project's index.html
NAV_STYLE='<style id="project-nav-style">.project-nav{font-family:"SF Mono","Monaco","Menlo",monospace;background:#1a1a2e;padding:0.5rem 1rem;font-size:0.9rem;}.project-nav a{color:#00d9ff;text-decoration:none;}.project-nav a:hover{text-decoration:underline;}.project-nav .sep{color:#666;}</style>'
for name in "${projects[@]}"; do
    project_index="$name/index.html"
    if [[ -f "$project_index" ]]; then
        # Check if nav already injected
        if ! grep -q 'id="project-nav-style"' "$project_index"; then
            NAV_HTML="<nav class=\"project-nav\"><a href=\"../index.html\">~/projects</a><span class=\"sep\">/</span><span>$name</span></nav>"
            # Inject after <body> tag
            sed -i.bak "s|<body[^>]*>|&$NAV_STYLE$NAV_HTML|" "$project_index"
            rm -f "$project_index.bak"
            echo "Injected nav into $project_index"
        fi
    fi
done
