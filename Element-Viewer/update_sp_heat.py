import json
import re
import os

def update_specific_heat_with_flags():
    input_file = 'scientific_data.ts'
    
    # Constantes Físicas
    ROOM_TEMP_K = 298.15
    DIATOMIC_ELEMENTS = ["H", "N", "O", "F", "Cl", "Br", "I"]
    
    # 1. Ler o arquivo original
    if not os.path.exists(input_file):
        print(f"Erro: Arquivo {input_file} não encontrado.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 2. Extrair o JSON da estrutura do TypeScript
    # Procura pelo primeiro '{' e o último '}'
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    
    if start_idx == -1 or end_idx == -1:
        print("Erro: Estrutura de objeto não encontrada no arquivo.")
        return

    json_str = content[start_idx:end_idx]
    
    # Limpeza para garantir JSON válido (remove vírgulas sobrando)
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON: {e}")
        return

    updated_count = 0

    # 3. Processar cada elemento
    for symbol, props in data.items():
        mass = props.get('mass', 0)
        
        # Tenta pegar o valor atual. Se já for objeto (de um script anterior), ignoramos ou lemos o 'solid' se disponível
        current_val_raw = props.get('specificHeat', 0)
        current_val = 0
        
        if isinstance(current_val_raw, (int, float)):
            current_val = float(current_val_raw)
        elif isinstance(current_val_raw, dict):
            # Se já rodou o script antes, tenta recuperar o valor sem asterisco para recalcular (reset)
            # Mas idealmente assumimos que o usuário quer rodar sobre o arquivo original numérico
            print(f"Aviso: {symbol} já parece ter sido processado. Pulando.")
            continue

        # Temperaturas de fase
        melting = props.get('phaseTemperatures', {}).get('meltingK', 0)
        boiling = props.get('phaseTemperatures', {}).get('boilingK', 0)
        
        if mass <= 0:
            continue

        # --- A. Determinar o Estado Padrão (Standard State) ---
        is_solid_std = False
        is_liquid_std = False
        is_gas_std = False

        if melting > 0 and boiling > 0:
            if ROOM_TEMP_K < melting:
                is_solid_std = True      # Sólido (Fe, Au...)
            elif melting <= ROOM_TEMP_K < boiling:
                is_liquid_std = True    # Líquido (Hg, Br)
            else:
                is_gas_std = True       # Gás (N, O, He...)
        else:
            # Se não tem dados de temperatura (elementos sintéticos), assume sólido
            is_solid_std = True

        # --- B. Calcular Estimativas (Baseadas na Massa) ---
        # Dulong-Petit para sólidos: ~24.94 J/mol.K
        raw_est_solid = (24.94 / mass) * 1000
        
        # Líquidos: ~15% maior que sólidos
        raw_est_liquid = raw_est_solid * 1.15
        
        # Gases: Teoria Cinética (Mono ou Diatômico)
        if symbol in DIATOMIC_ELEMENTS:
            raw_est_gas = (29.1 / mass) * 1000
        else:
            raw_est_gas = (20.78 / mass) * 1000

        # --- C. Atribuir Valores e Marcar Asteriscos ---
        
        val_solid_str = ""
        val_liquid_str = ""
        val_gas_str = ""

        # Função auxiliar para formatar
        def fmt(val, is_estimated):
            # Arredonda para 2 casas decimais e remove .00 se for inteiro visualmente
            s = f"{val:.2f}".rstrip('0').rstrip('.')
            return f"{s}*" if is_estimated else s

        if current_val > 0:
            # Temos dado real!
            if is_solid_std:
                # O dado original é SÓLIDO (Real)
                val_solid_str = fmt(current_val, False)
                # Estimamos os outros a partir deste dado real (mas ainda são estimativas)
                val_liquid_str = fmt(current_val * 1.15, True)
                val_gas_str = fmt(raw_est_gas, True) # Gás teórico é mais seguro que extrapolar do sólido
            
            elif is_liquid_std:
                # O dado original é LÍQUIDO (Real)
                val_liquid_str = fmt(current_val, False)
                # Estimamos sólido (inverso)
                val_solid_str = fmt(current_val / 1.15, True)
                val_gas_str = fmt(raw_est_gas, True)

            elif is_gas_std:
                # O dado original é GÁS (Real)
                val_gas_str = fmt(current_val, False)
                # Estimamos sólido e líquido via teoria (pois 1040 J/kgK do N2 gás não serve pra N sólido)
                val_solid_str = fmt(raw_est_solid, True)
                val_liquid_str = fmt(raw_est_liquid, True)
        else:
            # Dado original era 0 -> TUDO ESTIMADO
            val_solid_str = fmt(raw_est_solid, True)
            val_liquid_str = fmt(raw_est_liquid, True)
            val_gas_str = fmt(raw_est_gas, True)

        # Atualizar o objeto
        props['specificHeat'] = {
            "solid": val_solid_str,
            "liquid": val_liquid_str,
            "gas": val_gas_str
        }
        updated_count += 1

    # 4. Salvar o arquivo
    new_json_str = json.dumps(data, indent=2, ensure_ascii=False)
    
    # Remontar o arquivo .ts
    header = content[:start_idx]
    footer = content[end_idx:]
    
    # Se o footer estiver vazio ou quebrado, garante o ponto e vírgula
    if not footer.strip():
        footer = ";"
        
    final_content = f"{header}{new_json_str}{footer}"

    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print("-" * 40)
    print(f"SUCESSO! {updated_count} elementos atualizados.")
    print("Os valores estimados agora possuem um '*' ao final.")
    print(f"Exemplo do Ferro (Fe): {data['Fe']['specificHeat']}")
    print("-" * 40)

if __name__ == "__main__":
    update_specific_heat_with_flags()