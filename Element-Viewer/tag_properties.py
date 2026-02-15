import json
import re
import os

def update_scientific_data_final():
    file_path = 'scientific_data.ts'
    
    if not os.path.exists(file_path):
        print(f"Erro: O arquivo {file_path} não foi encontrado.")
        return

    # Lista oficial de símbolos do 1 (H) ao 99 (Es)
    symbols_1_to_99 = [
        "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
        "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
        "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
        "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
        "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es"
    ]

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrair JSON da estrutura TS
    match = re.search(r'export const SCIENTIFIC_DATA = (\{[\s\S]*\})\s*as const;', content)
    if not match:
        print("Erro: Estrutura SCIENTIFIC_DATA não encontrada.")
        return

    json_text = match.group(1)
    # Limpeza de trailing commas
    json_text = re.sub(r',\s*([\]}])', r'\1', json_text)
    data = json.loads(json_text)

    def has_ref(val):
        s = str(val)
        return any(s.endswith(x) for x in ["_3", "_4", "_5", "*"])

    def to_str_clean(val):
        """Converte para string e remove .0 desnecessário"""
        if isinstance(val, (int, float)):
            if val == 0: return "0"
            s = f"{val:.4f}".rstrip('0').rstrip('.')
            return s
        return str(val)

    for symbol, props in data.items():
        # --- 1. TRATAMENTO DE VALORES NULOS/ZERADOS (VIRA "N/A") ---
        
        # Thermal Conductivity
        if props.get("thermalConductivity") in [0, "0", 0.0]:
            props["thermalConductivity"] = "N/A"
            
        # Atomic Radius
        if props.get("atomicRadiusPm") in [0, "0", 0.0]:
            props["atomicRadiusPm"] = "N/A"
            
        # Oxidation States
        if props.get("oxidationStates") == []:
            props["oxidationStates"] = "N/A"

        # Latent Heat
        if "latentHeat" in props:
            lh = props["latentHeat"]
            if isinstance(lh, dict):
                if lh.get("fusion") in [0, 0.0, "0"]: lh["fusion"] = "N/A"
                if lh.get("vaporization") in [0, 0.0, "0"]: lh["vaporization"] = "N/A"

        # Phase Temperatures
        if "phaseTemperatures" in props:
            pt = props["phaseTemperatures"]
            if isinstance(pt, dict):
                if pt.get("meltingK") in [0, 0.0, "0"]: pt["meltingK"] = "N/A"
                if pt.get("boilingK") in [0, 0.0, "0"]: pt["boilingK"] = "N/A"

        # --- 2. APLICAÇÃO DE REFERÊNCIAS (_3, _5) ---

        # Raio Atômico (_3) - Apenas 1 a 99 e se não for N/A
        if symbol in symbols_1_to_99 and props["atomicRadiusPm"] != "N/A":
            if not has_ref(props["atomicRadiusPm"]):
                props["atomicRadiusPm"] = f"{to_str_clean(props['atomicRadiusPm'])}_3"

        # Calor Latente (_5) - Se não for N/A
        if "latentHeat" in props and isinstance(props["latentHeat"], dict):
            lh = props["latentHeat"]
            if lh["fusion"] != "N/A" and not has_ref(lh["fusion"]):
                lh["fusion"] = f"{to_str_clean(lh['fusion'])}_5"
            if lh["vaporization"] != "N/A" and not has_ref(lh["vaporization"]):
                lh["vaporization"] = f"{to_str_clean(lh['vaporization'])}_5"

        # --- 3. REGRA GERAL (_2) PARA O RESTO ---
        # Aplica em tudo que sobrou preenchido sem referência
        
        def apply_gen_ref(obj):
            if isinstance(obj, dict):
                for k, v in obj.items():
                    if k in ["color", "oxidationStates"]: continue # Ignora cores e listas
                    
                    if isinstance(v, dict):
                        apply_gen_ref(v)
                    elif v != "N/A" and not has_ref(v):
                        obj[k] = f"{to_str_clean(v)}_2"
            elif isinstance(obj, list):
                # O usuário não especificou tags dentro de listas de estados de oxidação
                pass

        apply_gen_ref(props)

    # 5. Salvar arquivo
    updated_json = json.dumps(data, indent=2, ensure_ascii=False)
    final_content = content[:match.start(1)] + updated_json + content[match.end(1):]

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print(f"Sucesso! Referências (_2, _3, _5) e 'N/A' aplicados corretamente.")

if __name__ == "__main__":
    update_scientific_data_final()