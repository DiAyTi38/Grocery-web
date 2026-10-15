#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script chuyển đổi báo cáo Markdown (docs/PROJECT_REPORT.md) sang định dạng:
1. HTML chất lượng cao (docs/PROJECT_REPORT.html)
2. Microsoft Word Document (docs/PROJECT_REPORT.doc)
3. PDF Document chuẩn in ấn qua Headless Chrome (docs/PROJECT_REPORT.pdf)
"""

import os
import re
import html
import subprocess
import sys

def parse_markdown_to_html(md_text):
    lines = md_text.splitlines()
    html_lines = []
    
    in_code_block = False
    code_lang = ""
    code_lines = []
    
    in_table = False
    table_header = []
    table_alignments = []
    table_rows = []
    
    in_blockquote = False
    blockquote_type = "NOTE"
    blockquote_lines = []
    
    in_list = False
    list_type = "ul"
    
    def format_inline(text):
        # Escape HTML characters first
        text = html.escape(text)
        
        # Unescape markdown backticks, asterisks, brackets that might be needed
        # Inline code
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        
        # Bold + Italic
        text = re.sub(r'\*\*\*([^\*]+)\*\*\*', r'<strong><em>\1</em></strong>', text)
        
        # Bold
        text = re.sub(r'\*\*([^\*]+)\*\*', r'<strong>\1</strong>', text)
        
        # Italic
        text = re.sub(r'\*([^\*]+)\*', r'<em>\1</em>', text)
        
        # Checkboxes
        text = text.replace('[ ]', '☐').replace('[x]', '☑')
        
        # Links: [text](url)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
        
        # Math: $...$ -> <span class="math">...</span>
        text = re.sub(r'\$([^\$]+)\$', r'<span class="math">\1</span>', text)
        
        return text

    def close_table():
        nonlocal in_table, table_header, table_alignments, table_rows
        if not in_table:
            return
        
        table_html = ['<div class="table-container"><table>']
        if table_header:
            table_html.append('<thead><tr>')
            for i, h in enumerate(table_header):
                align = table_alignments[i] if i < len(table_alignments) else 'left'
                table_html.append(f'<th style="text-align: {align};">{format_inline(h)}</th>')
            table_html.append('</tr></thead>')
        
        if table_rows:
            table_html.append('<tbody>')
            for r in table_rows:
                table_html.append('<tr>')
                for i, cell in enumerate(r):
                    align = table_alignments[i] if i < len(table_alignments) else 'left'
                    table_html.append(f'<td style="text-align: {align};">{format_inline(cell)}</td>')
                table_html.append('</tr>')
            table_html.append('</tbody>')
            
        table_html.append('</table></div>')
        html_lines.append('\n'.join(table_html))
        
        in_table = False
        table_header = []
        table_alignments = []
        table_rows = []

    def close_blockquote():
        nonlocal in_blockquote, blockquote_type, blockquote_lines
        if not in_blockquote:
            return
        
        type_class = blockquote_type.lower()
        title_map = {
            "NOTE": ("💡 Ghi chú Kỹ thuật", "#3b82f6", "#eff6ff"),
            "WARNING": ("⚠️ Cảnh báo Rủi ro", "#f59e0b", "#fffbeb"),
            "CAUTION": ("🛑 Lưu ý Nghiêm trọng", "#ef4444", "#fef2f2"),
            "IMPORTANT": ("📌 Yếu tố Quan trọng", "#8b5cf6", "#f5f3ff"),
            "TIP": ("✨ Khuyến nghị Tối ưu", "#10b981", "#ecfdf5")
        }
        
        title, border_color, bg_color = title_map.get(blockquote_type, ("Thông tin", "#64748b", "#f8fafc"))
        
        bq_content = '<br/>'.join([format_inline(l) for l in blockquote_lines])
        html_lines.append(f'''<div class="callout callout-{type_class}" style="border-left: 4px solid {border_color}; background-color: {bg_color};">
            <div class="callout-title" style="color: {border_color};"><strong>{title}</strong></div>
            <div class="callout-body">{bq_content}</div>
        </div>''')
        
        in_blockquote = False
        blockquote_lines = []

    def close_list():
        nonlocal in_list, list_type
        if in_list:
            html_lines.append(f'</{list_type}>')
            in_list = False

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Handle Code Blocks
        if stripped.startswith("```"):
            if in_code_block:
                # End code block
                code_content = html.escape('\n'.join(code_lines))
                if code_lang == "mermaid":
                    html_lines.append(f'<div class="mermaid-diagram"><pre class="mermaid-code"><code>{code_content}</code></pre></div>')
                else:
                    html_lines.append(f'<pre><code class="language-{code_lang}">{code_content}</code></pre>')
                in_code_block = False
                code_lines = []
                code_lang = ""
            else:
                close_table()
                close_blockquote()
                close_list()
                in_code_block = True
                code_lang = stripped[3:].strip()
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Handle Blockquotes
        if stripped.startswith(">"):
            close_table()
            close_list()
            content = stripped[1:].strip()
            
            # Check for alert tag: > [!NOTE], > [!WARNING], etc.
            alert_match = re.match(r'^\[!(NOTE|WARNING|CAUTION|IMPORTANT|TIP)\]\s*(.*)$', content)
            if alert_match:
                close_blockquote()
                in_blockquote = True
                blockquote_type = alert_match.group(1)
                first_text = alert_match.group(2).strip()
                if first_text:
                    blockquote_lines.append(first_text)
            else:
                if not in_blockquote:
                    in_blockquote = True
                    blockquote_type = "NOTE"
                blockquote_lines.append(content)
            i += 1
            continue
        elif in_blockquote:
            close_blockquote()

        # Handle Tables
        if stripped.startswith("|") and stripped.endswith("|"):
            close_list()
            cells = [c.strip() for c in stripped.split("|")[1:-1]]
            
            # Check if this is a separator line: | :--- | :---: |
            is_separator = all(re.match(r'^:?-+:?$', c) for c in cells)
            
            if is_separator:
                table_alignments = []
                for c in cells:
                    if c.startswith(":") and c.endswith(":"):
                        table_alignments.append("center")
                    elif c.endswith(":"):
                        table_alignments.append("right")
                    else:
                        table_alignments.append("left")
            elif not in_table:
                # Header row
                in_table = True
                table_header = cells
                table_rows = []
            else:
                table_rows.append(cells)
            i += 1
            continue
        elif in_table:
            close_table()

        # Handle Headings
        if stripped.startswith("#"):
            close_list()
            level = len(stripped.split()[0])
            title = stripped[level:].strip()
            # Generate id for linkable table of contents
            anchor_id = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower()).replace(' ', '-')
            html_lines.append(f'<h{level} id="{anchor_id}">{format_inline(title)}</h{level}>')
            i += 1
            continue

        # Handle Horizontal Rules
        if stripped in ["---", "***", "___"]:
            close_list()
            html_lines.append('<hr/>')
            i += 1
            continue

        # Handle Lists
        list_match = re.match(r'^(\s*)([-*]|\d+\.)\s+(.*)$', line)
        if list_match:
            indent, marker, item_content = list_match.groups()
            current_list_type = "ol" if marker.endswith(".") else "ul"
            
            if not in_list:
                in_list = True
                list_type = current_list_type
                html_lines.append(f'<{list_type}>')
            elif list_type != current_list_type:
                html_lines.append(f'</{list_type}>')
                list_type = current_list_type
                html_lines.append(f'<{list_type}>')
            
            html_lines.append(f'<li>{format_inline(item_content)}</li>')
            i += 1
            continue
        elif in_list and stripped == "":
            # keep list open for multiline
            pass
        elif in_list:
            close_list()

        # Handle Math blocks: $$...$$
        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            math_content = stripped[2:-2].strip()
            html_lines.append(f'<div class="math-block"><code>{html.escape(math_content)}</code></div>')
            i += 1
            continue

        # Empty line
        if stripped == "":
            i += 1
            continue

        # Normal Paragraph
        html_lines.append(f'<p>{format_inline(line)}</p>')
        i += 1

    close_table()
    close_blockquote()
    close_list()

    return '\n'.join(html_lines)


def generate_full_html(body_html, is_for_word=False):
    word_xml_ns = ""
    if is_for_word:
        word_xml_ns = "xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'"

    return f"""<!DOCTYPE html>
<html lang="vi" {word_xml_ns}>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo Cáo Dự Án Smart Grocery</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {{
            size: A4;
            margin: 20mm 18mm 20mm 18mm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
        }}
        @page WordSection1 {{
            size: 595.3pt 841.9pt;
            margin: 54.0pt 54.0pt 54.0pt 54.0pt;
        }}
        div.WordSection1 {{
            page: WordSection1;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            padding: 24px 32px;
        }}
        h1 {{
            font-size: 20pt;
            color: #0f172a;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-top: 24pt;
            margin-bottom: 12pt;
            page-break-after: avoid;
        }}
        h2 {{
            font-size: 15pt;
            color: #0369a1;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-top: 18pt;
            margin-bottom: 10pt;
            page-break-after: avoid;
        }}
        h3 {{
            font-size: 12.5pt;
            color: #0f172a;
            margin-top: 14pt;
            margin-bottom: 8pt;
            page-break-after: avoid;
        }}
        h4 {{
            font-size: 11pt;
            color: #334155;
            margin-top: 10pt;
            margin-bottom: 6pt;
            page-break-after: avoid;
        }}
        p {{
            margin-top: 0;
            margin-bottom: 8pt;
            text-align: justify;
        }}
        a {{
            color: #0284c7;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        hr {{
            border: none;
            border-top: 1px solid #cbd5e1;
            margin: 16pt 0;
        }}
        /* Tables */
        .table-container {{
            width: 100%;
            margin: 12pt 0;
            overflow-x: auto;
            page-break-inside: avoid;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 8pt;
        }}
        th, td {{
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            vertical-align: top;
        }}
        th {{
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: 600;
        }}
        tr:nth-child(even) td {{
            background-color: #f8fafc;
        }}
        /* Callouts / Alerts */
        .callout {{
            border-radius: 6px;
            padding: 12px 16px;
            margin: 12pt 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }}
        .callout-title {{
            font-size: 10.5pt;
            margin-bottom: 6px;
        }}
        .callout-body {{
            line-height: 1.5;
        }}
        /* Code Blocks */
        pre {{
            background-color: #0f172a;
            color: #f8fafc;
            padding: 12px 16px;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 9pt;
            overflow-x: auto;
            margin: 10pt 0;
            page-break-inside: avoid;
            line-height: 1.45;
        }}
        code {{
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 9.5pt;
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 2px 5px;
            border-radius: 4px;
        }}
        pre code {{
            background-color: transparent;
            color: inherit;
            padding: 0;
        }}
        .mermaid-diagram pre {{
            background-color: #f8fafc;
            color: #0f172a;
            border: 1px solid #cbd5e1;
        }}
        .math-block {{
            background-color: #f8fafc;
            border-left: 3px solid #6366f1;
            padding: 8px 14px;
            margin: 10pt 0;
            font-family: serif;
            font-size: 11pt;
            page-break-inside: avoid;
        }}
        .math {{
            font-family: serif;
            font-style: italic;
            background: #f1f5f9;
            padding: 1px 4px;
            border-radius: 3px;
        }}
        ul, ol {{
            margin-top: 0;
            margin-bottom: 8pt;
            padding-left: 20px;
        }}
        li {{
            margin-bottom: 4pt;
        }}
    </style>
</head>
<body>
<div class="WordSection1">
    <div class="container">
        {body_html}
    </div>
</div>
</body>
</html>
"""


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    md_path = os.path.join(base_dir, "docs", "PROJECT_REPORT.md")
    html_path = os.path.join(base_dir, "docs", "PROJECT_REPORT.html")
    doc_path = os.path.join(base_dir, "docs", "PROJECT_REPORT.doc")
    pdf_path = os.path.join(base_dir, "docs", "PROJECT_REPORT.pdf")

    if not os.path.exists(md_path):
        print(f"Lỗi: Không tìm thấy file {md_path}")
        sys.exit(1)

    print(f"[1] Đang đọc file Markdown: {md_path}...")
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    print("[2] Đang phân tích Markdown và tạo HTML chuẩn...")
    body_html = parse_markdown_to_html(md_text)
    
    # 1. Tạo HTML view
    full_html = generate_full_html(body_html, is_for_word=False)
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f" -> Đã tạo HTML: {html_path}")

    # 2. Tạo Microsoft Word .doc
    word_html = generate_full_html(body_html, is_for_word=True)
    with open(doc_path, "w", encoding="utf-8") as f:
        f.write(word_html)
    print(f" -> Đã tạo Microsoft Word Document: {doc_path}")

    # 3. Tạo PDF qua Headless Chrome
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if os.path.exists(chrome_path):
        print("[3] Đang xuất PDF chuẩn qua Google Chrome Headless Engine...")
        user_data_dir = "/tmp/chrome_report_pdf"
        cmd = [
            chrome_path,
            "--headless",
            "--disable-gpu",
            f"--user-data-dir={user_data_dir}",
            f"--print-to-pdf={pdf_path}",
            "--no-pdf-header-footer",
            html_path
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and os.path.exists(pdf_path):
            file_size_kb = os.path.getsize(pdf_path) / 1024
            print(f" -> Đã tạo PDF thành công: {pdf_path} ({file_size_kb:.1f} KB)")
        else:
            print(f" -> Chrome PDF exit code: {res.returncode}, stderr: {res.stderr}")
    else:
        print(" -> Không tìm thấy Google Chrome để tạo PDF tự động.")

    print("\n[+] HOÀN TẤT CHUYỂN ĐỔI BÁO CÁO!")

if __name__ == "__main__":
    main()
