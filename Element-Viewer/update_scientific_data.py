import re
import os

# ==============================================================================
# PLACEHOLDERS PARA AS STRINGS
# ==============================================================================

STRING_1_FUSION = """
Actinium
14.2 kJ/mol  


Aluminum
10.67 kJ/mol 


Americium
14.4 kJ/mol  


Antimony
20.9 kJ/mol  


Argon
 1.21 kJ/mol 


Astatine
23.8 kJ/mol  


Barium
 7.66 kJ/mol 


Beryllium
 9.8 kJ/mol  


Bismuth
10.48 kJ/mol 


Boron
22.2 kJ/mol  


Bromine
10.8 kJ/mol  


Cadmium
 6.11 kJ/mol 


Calcium
 9.33 kJ/mol 


Cerium
 8.87 kJ/mol 


Cesium
 2.09 kJ/mol 


Chlorine
 6.41 kJ/mol 


Chromium
15.3 kJ/mol  


Cobalt
15.2 kJ/mol  


Copper
13 kJ/mol    


Dysprosium
17.2 kJ/mol  


Erbium
17.2 kJ/mol  


Europium
10.5 kJ/mol  


Fluorine
 5.1 kJ/mol  


Gadolinium
15.5 kJ/mol  


Gallium
 5.59 kJ/mol 


Germanium
34.7 kJ/mol  


Gold
12.7 kJ/mol  


Hafnium
25.5 kJ/mol  


Holmium
17.2 kJ/mol  


Hydrogen
 0.12 kJ/mol 


Indium
 3.27 kJ/mol 


Iodine
15.27 kJ/mol 


Iridium
26.4 kJ/mol  


Iron
14.9 kJ/mol  


Krypton
 1.64 kJ/mol 


Lanthanum
10.04 kJ/mol 


Lead
 5.121 kJ/mol


Lithium
 4.6 kJ/mol  


Lutetium
19.2 kJ/mol  


Magnesium
 9.04 kJ/mol 


Manganese
14.4 kJ/mol  


Mercury
 2.331 kJ/mol


Molybdenum
27.6 kJ/mol  


Neodymium
 7.113 kJ/mol


Neon
 0.324 kJ/mol


Neptunium
 9.46 kJ/mol 


Nickel
17.6 kJ/mol  


Niobium
27.2 kJ/mol  


Nitrogen
 0.72 kJ/mol 


Osmium
29.3 kJ/mol  


Oxygen
 0.444 kJ/mol


Palladium
17.2 kJ/mol  


Phosphorus
 2.51 kJ/mol 


Platinum
19.7 kJ/mol  


Plutonium
 2.8 kJ/mol  


Polonium
10 kJ/mol    


Potassium
 2.4 kJ/mol  


Praseodymium
11.3 kJ/mol  


Promethium
12.6 kJ/mol  


Protactinium
16.7 kJ/mol  


Radium
 7.15 kJ/mol 


Radon
 2.7 kJ/mol  


Rhenium
33.1 kJ/mol  


Rhodium
21.55 kJ/mol 


Rubidium
 2.2 kJ/mol  


Ruthenium
23.7 kJ/mol  


Samarium
10.9 kJ/mol  


Scandium
15.9 kJ/mol  


Selenium
 5.1 kJ/mol  


Silicon
39.6 kJ/mol  


Silver
11.3 kJ/mol  


Sodium
 2.64 kJ/mol 


Strontium
 6.16 kJ/mol 


Sulfur
 1.23 kJ/mol 


Tantalum
31.4 kJ/mol  


Technetium
23.81 kJ/mol 


Tellurium
13.5 kJ/mol  


Terbium
16.3 kJ/mol  


Thallium
 4.31 kJ/mol 


Thorium
19.2 kJ/mol  


Thulium
18.4 kJ/mol  


Tin
 7.2 kJ/mol  


Titanium
20.9 kJ/mol  


Tungsten
35.2 kJ/mol  


Uranium
15.5 kJ/mol  


Vanadium
17.6 kJ/mol  


Xenon
 3.1 kJ/mol  


Ytterbium
 9.2 kJ/mol  


Yttrium
17.2 kJ/mol  


Zinc
 6.67 kJ/mol 


Zirconium
23 kJ/mol    
"""

STRING_2_VAPORIZATION = """
Actinium
293 kJ/mol     


Aluminum
293.72 kJ/mol  


Americium
238.5 kJ/mol   


Antimony
 67.91 kJ/mol  


Argon
  6.53 kJ/mol  


Barium
150.9 kJ/mol   


Beryllium
308.8 kJ/mol   


Bismuth
179.1 kJ/mol   


Boron
538.9 kJ/mol   


Bromine
 30 kJ/mol     


Cadmium
 99.87 kJ/mol  


Calcium
149.95 kJ/mol  


Cerium
313.8 kJ/mol   


Cesium
 65.9 kJ/mol   


Chlorine
 20.403 kJ/mol 


Chromium
348.78 kJ/mol  


Cobalt
382.4 kJ/mol   


Copper
304.6 kJ/mol   


Dysprosium
293 kJ/mol     


Erbium
292.9 kJ/mol   


Europium
175.7 kJ/mol   


Fluorine
  6.548 kJ/mol 


Gadolinium
311.7 kJ/mol   


Gallium
256.1 kJ/mol   


Germanium
334.3 kJ/mol   


Gold
324.4 kJ/mol   


Hafnium
661.1 kJ/mol   


Helium
  0.082 kJ/mol 


Holmium
251 kJ/mol     


Hydrogen
  0.46 kJ/mol  


Indium
226.4 kJ/mol   


Iodine
 41.67 kJ/mol  


Iridium
563.6 kJ/mol   


Iron
351 kJ/mol     


Krypton
  9.05 kJ/mol  


Lanthanum
399.6 kJ/mol   


Lead
179.4 kJ/mol   


Lithium
134.7 kJ/mol   


Lutetium
428 kJ/mol     


Magnesium
128.7 kJ/mol   


Manganese
219.7 kJ/mol   


Mercury
 59.15 kJ/mol  


Molybdenum
594.1 kJ/mol   


Neodymium
283.7 kJ/mol   


Neon
  1.1736 kJ/mol


Neptunium
336.6 kJ/mol   


Nickel
371.8 kJ/mol   


Niobium
696.6 kJ/mol   


Nitrogen
  5.577 kJ/mol 


Osmium
627.6 kJ/mol   


Oxygen
  6.82 kJ/mol  


Palladium
393.3 kJ/mol   


Phosphorus
 51.9 kJ/mol   


Platinum
510.5 kJ/mol   


Plutonium
343.5 kJ/mol   


Polonium
100.8 kJ/mol   


Potassium
 77.53 kJ/mol  


Praseodymium
332.6 kJ/mol   


Protactinium
481 kJ/mol     


Radium
136.8 kJ/mol   


Radon
 19.1 kJ/mol   


Rhenium
707.1 kJ/mol   


Rhodium
495.4 kJ/mol   


Rubidium
 69.2 kJ/mol   


Ruthenium
567.8 kJ/mol   


Samarium
191.6 kJ/mol   


Scandium
304.8 kJ/mol   


Selenium
 26.32 kJ/mol  


Silicon
383.3 kJ/mol   


Silver
255.1 kJ/mol   


Sodium
 89.04 kJ/mol  


Strontium
138.91 kJ/mol  


Sulfur
  9.62 kJ/mol  


Tantalum
753.1 kJ/mol   


Technetium
585.22 kJ/mol  


Tellurium
 50.63 kJ/mol  


Terbium
391 kJ/mol     


Thallium
162.1 kJ/mol   


Thorium
543.9 kJ/mol   


Thulium
247 kJ/mol     


Tin
290.4 kJ/mol   


Titanium
428.9 kJ/mol   


Tungsten
799.1 kJ/mol   


Uranium
422.6 kJ/mol   


Vanadium
458.6 kJ/mol   


Xenon
 12.65 kJ/mol  


Ytterbium
159 kJ/mol     


Yttrium
393.3 kJ/mol   


Zinc
115.3 kJ/mol   


Zirconium
581.6 kJ/mol   
"""

STRING_3_BULK_MODULUS = """
Actinium
 25 GPa  


estimated

Aluminum
 72.2 GPa


Antimony
 38.3 GPa


Argon
77 K
  1.3 GPa


Arsenic
 39.4 GPa


Barium
 10.3 GPa


Beryllium
100.3 GPa


Bismuth
 31.5 GPa


Boron
178 GPa  


Cadmium
 46.7 GPa


Calcium
 15.2 GPa


Carbon
diamond
545 GPa  


Cerium
γ-cerium
 23.9 GPa


Cesium
  2.0 GPa


Chromium
190.1 GPa


Cobalt
191.4 GPa


Copper
137 GPa  


Dysprosium
 38.4 GPa


Erbium
 41.1 GPa


Europium
 14.7 GPa


Francium
  2.0 GPa


estimated

Gadolinium
 38.3 GPa


Gallium
273 K
 56.9 GPa


Germanium
 77.2 GPa


Gold
173.2 GPa


Hafnium
109 GPa  


Holmium
 39.7 GPa


Hydrogen
4 K
  0.2 GPa


Indium
 41.1 GPa


Iridium
355 GPa  


Iron
168.3 GPa


Krypton
77 K
  1.8 GPa


Lanthanum
 24.3 GPa


Lead
 43.0 GPa


Lithium
 11.6 GPa


Lutetium
 41.1 GPa


Magnesium
 35.4 GPa


Manganese
 59.6 GPa


Mercury
1 K
 38.2 GPa


Molybdenum
272.5 GPa


Neodymium
 32.7 GPa


Neon
4 K
  1.0 GPa


Neptunium
 68 GPa  


estimated

Nickel
186 GPa  


Niobium
170.2 GPa


Nitrogen
81 K
  1.2 GPa


Osmium
418 GPa  


estimated

Palladium
180.8 GPa


Phosphorus
black phosphorus
 30.4 GPa


Platinum
278.3 GPa


Plutonium
 54 GPa  


Polonium
 26 GPa  


estimated

Potassium
  3.2 GPa


Praseodymium
 30.6 GPa


Promethium
 35 GPa  


estimated

Protactinium
 76 GPa  


estimated

Radium
 13.2 GPa


estimated

Rhenium
372 GPa  


Rhodium
270.4 GPa


Rubidium
  3.1 GPa


Ruthenium
320.8 GPa


Samarium
 29.4 GPa


Scandium
 43.5 GPa


Selenium
  9.1 GPa


Silicon
 98.8 GPa


Silver
100.7 GPa


Sodium
  6.8 GPa


Strontium
 11.6 GPa


Sulfur
α-orthorhombic sulfur
 17.8 GPa


Tantalum
200 GPa  


Technetium
297 GPa  


estimated

Tellurium
 23.0 GPa


Terbium
 39.9 GPa


Thallium
 35.9 GPa


Thorium
 54.3 GPa


Thulium
 39.7 GPa


Tin
gray tin
111 GPa  


Titanium
105.1 GPa


Tungsten
323.2 GPa


Uranium
 98.7 GPa


Vanadium
161.9 GPa


Ytterbium
 13.3 GPa


Yttrium
 36.6 GPa


Zinc
 59.8 GPa


Zirconium
 83.3 GPa
"""

# ==============================================================================
# LÓGICA DO SCRIPT
# ==============================================================================

ELEMENT_MAP = {
    'Actinium': 'Ac', 'Aluminum': 'Al', 'Americium': 'Am', 'Antimony': 'Sb', 'Argon': 'Ar',
    'Arsenic': 'As', 'Astatine': 'At', 'Barium': 'Ba', 'Beryllium': 'Be', 'Bismuth': 'Bi',
    'Boron': 'B', 'Bromine': 'Br', 'Cadmium': 'Cd', 'Calcium': 'Ca', 'Carbon': 'C',
    'Cerium': 'Ce', 'Cesium': 'Cs', 'Chlorine': 'Cl', 'Chromium': 'Cr', 'Cobalt': 'Co',
    'Copper': 'Cu', 'Dysprosium': 'Dy', 'Erbium': 'Er', 'Europium': 'Eu', 'Fluorine': 'F',
    'Francium': 'Fr', 'Gadolinium': 'Gd', 'Gallium': 'Ga', 'Germanium': 'Ge', 'Gold': 'Au',
    'Hafnium': 'Hf', 'Holmium': 'Ho', 'Hydrogen': 'H', 'Indium': 'In', 'Iodine': 'I',
    'Iridium': 'Ir', 'Iron': 'Fe', 'Krypton': 'Kr', 'Lanthanum': 'La', 'Lead': 'Pb',
    'Lithium': 'Li', 'Lutetium': 'Lu', 'Magnesium': 'Mg', 'Manganese': 'Mn', 'Mercury': 'Hg',
    'Molybdenum': 'Mo', 'Neodymium': 'Nd', 'Neon': 'Ne', 'Neptunium': 'Np', 'Nickel': 'Ni',
    'Niobium': 'Nb', 'Nitrogen': 'N', 'Osmium': 'Os', 'Oxygen': 'O', 'Palladium': 'Pd',
    'Phosphorus': 'P', 'Platinum': 'Pt', 'Plutonium': 'Pu', 'Polonium': 'Po', 'Potassium': 'K',
    'Praseodymium': 'Pr', 'Promethium': 'Pm', 'Protactinium': 'Pa', 'Radium': 'Ra',
    'Radon': 'Rn', 'Rhenium': 'Re', 'Rhodium': 'Rh', 'Rubidium': 'Rb', 'Ruthenium': 'Ru',
    'Samarium': 'Sm', 'Scandium': 'Sc', 'Selenium': 'Se', 'Silicon': 'Si', 'Silver': 'Ag',
    'Sodium': 'Na', 'Strontium': 'Sr', 'Sulfur': 'S', 'Tantalum': 'Ta', 'Technetium': 'Tc',
    'Tellurium': 'Te', 'Terbium': 'Tb', 'Thallium': 'Tl', 'Thorium': 'Th', 'Thulium': 'Tm',
    'Tin': 'Sn', 'Titanium': 'Ti', 'Tungsten': 'W', 'Uranium': 'U', 'Vanadium': 'V',
    'Xenon': 'Xe', 'Ytterbium': 'Yb', 'Yttrium': 'Y', 'Zinc': 'Zn', 'Zirconium': 'Zr'
}

def extract_number(text):
    match = re.search(r"[\d\.]+", text)
    return match.group(0) if match else "N/A"

def parse_regular_string(string_data, suffix, keyword):
    """Parseia as strings 1 e 2 (sem variação)."""
    data = {}
    current_elem = None
    for line in string_data.strip().split('\n'):
        line = line.strip()
        if not line: continue
        
        if line in ELEMENT_MAP:
            current_elem = ELEMENT_MAP[line]
        elif current_elem and keyword in line.lower():
            num = extract_number(line)
            data[current_elem] = f"{num}{suffix}"
            current_elem = None
    return data

def parse_string_with_variations(string_data, suffix):
    """Parseia a string 3 capturando variações/condições e a flag 'estimated'."""
    data = {}
    lines = [line.strip() for line in string_data.strip().split('\n') if line.strip()]
    
    i = 0
    while i < len(lines):
        line = lines[i]
        is_estimated = False
        
        if line.lower() == "estimated":
            is_estimated = True
            i += 1
            if i >= len(lines): break
            line = lines[i]
            
        if line in ELEMENT_MAP:
            current_elem = ELEMENT_MAP[line]
            i += 1
            if i >= len(lines): break
            
            variation = None
            next_line = lines[i]
            
            # Se a linha seguinte não for o valor em GPa, significa que é a variação (ex: "diamond", "77 K")
            if "GPa" not in next_line:
                variation = next_line
                i += 1
                if i >= len(lines): break
                next_line = lines[i]
            
            # Chegou no valor
            if "GPa" in next_line:
                val_str = extract_number(next_line)
                ast = "*" if is_estimated else ""
                
                data[current_elem] = {
                    "value": f"{val_str}{ast}{suffix}",
                    "variation": variation
                }
        i += 1
        
    return data

def main():
    data_fusion = parse_regular_string(STRING_1_FUSION, "_13", "kj/mol")
    data_vaporization = parse_regular_string(STRING_2_VAPORIZATION, "_14", "kj/mol")
    data_bulk = parse_string_with_variations(STRING_3_BULK_MODULUS, "_15")

    ts_file_path = "D:\\NOAH\\Área de Trabalho\\Tudo\\Noah\\Renda Extra\\element viewer\\element-viewer-mcp\\Element-Viewer\\scientific_data.ts"
    
    if not os.path.exists(ts_file_path):
        print(f"Erro: O arquivo '{ts_file_path}' não foi encontrado.")
        return

    with open(ts_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    symbols_in_file = set(re.findall(r'\n\s+"([A-Z][a-z]?)":\s*\{', content))

    for sym in symbols_in_file:
        v_fusion = data_fusion.get(sym, "N/A")
        v_vaporization = data_vaporization.get(sym, "N/A")
        v_bulk_obj = data_bulk.get(sym, "N/A")

        # Formata o bulkModulusGPA para ser objeto ou string dependendo da variação
        if isinstance(v_bulk_obj, dict):
            if v_bulk_obj["variation"]:
                bulk_json = (
                    f"{{\n"
                    f"      \"value\": \"{v_bulk_obj['value']}\",\n"
                    f"      \"variation\": \"{v_bulk_obj['variation']}\"\n"
                    f"    }}"
                )
            else:
                bulk_json = f"\"{v_bulk_obj['value']}\""
        else:
            bulk_json = f"\"{v_bulk_obj}\""

        start_match = re.search(rf'\n\s+"{sym}":\s*\{{', content)
        if not start_match: continue

        start_idx = start_match.end() - 1
        brace_count = 0
        end_idx = -1

        for i in range(start_idx, len(content)):
            if content[i] == '{':
                brace_count += 1
            elif content[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i
                    break

        if end_idx != -1:
            last_char_idx = end_idx - 1
            while last_char_idx > start_idx and content[last_char_idx].isspace():
                last_char_idx -= 1

            prefix_comma = "," if content[last_char_idx] not in [',', '{'] else ""

            # Injeção das chaves mantendo a indentação do seu JSON
            new_props = (
                f"{prefix_comma}\n"
                f"    \"enthalpyFusionKjMol\": \"{v_fusion}\",\n"
                f"    \"enthalpyVaporizationKjMol\": \"{v_vaporization}\",\n"
                f"    \"bulkModulusGPA\": {bulk_json}\n"
                f"  "
            )

            content = content[:end_idx] + new_props + content[end_idx:]

    with open(ts_file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ scientific_data.ts foi atualizado com sucesso!")

if __name__ == "__main__":
    main()