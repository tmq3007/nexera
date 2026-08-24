import sys
import docx

def convert_docx_to_md(docx_path, md_path):
    try:
        doc = docx.Document(docx_path)
        md_lines = []
        
        for p in doc.paragraphs:
            text = p.text.strip()
            if not text:
                continue
                
            style_name = p.style.name.lower() if p.style and p.style.name else ""
            
            if 'heading 1' in style_name:
                md_lines.append(f"# {text}\n")
            elif 'heading 2' in style_name:
                md_lines.append(f"## {text}\n")
            elif 'heading 3' in style_name:
                md_lines.append(f"### {text}\n")
            elif 'heading 4' in style_name:
                md_lines.append(f"#### {text}\n")
            elif 'list bullet' in style_name or 'list' in style_name:
                md_lines.append(f"- {text}")
            else:
                # If it looks like a roman numeral heading or uppercase heading, we can manually format
                if text.isupper() and len(text) > 10:
                    md_lines.append(f"## {text}\n")
                elif text.startswith(('I.', 'II.', 'III.', 'IV.')):
                    md_lines.append(f"### {text}\n")
                elif text.startswith(('1.', '2.', '3.', '4.', '5.')):
                    md_lines.append(f"#### {text}\n")
                else:
                    md_lines.append(f"{text}\n")
                    
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(md_lines))
            
        print(f"Successfully converted to {md_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python docx_to_md.py <input.docx> <output.md>")
    else:
        convert_docx_to_md(sys.argv[1], sys.argv[2])
