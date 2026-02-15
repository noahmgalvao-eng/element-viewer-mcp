import json
import re
import os

def update_thermal_conductivity():
    filename = 'scientific_data.ts'
    
    # String bruta fornecida (Thermal Conductivity Data)
    raw_data = """Thermal ConductivityNameSymbol#0.0000364 W/cmKRadonRn860.0000569 W/cmKXenonXe540.000089 W/cmKChlorineCl170.0000949 W/cmKKryptonKr360.0001772 W/cmKArgonAr180.0002598 W/cmKNitrogenN70.0002674 W/cmKOxygenO80.000279 W/cmKFluorineF90.000493 W/cmKNeonNe100.00122 W/cmKBromineBr350.00152 W/cmKHeliumHe20.001815 W/cmKHydrogenH10.00235 W/cmKPhosphorusP150.00269 W/cmKSulfurS160.00449 W/cmKIodineI530.017 W/cmKAstatineAt850.0204 W/cmKSeleniumSe340.0235 W/cmKTelluriumTe520.063 W/cmKNeptuniumNp930.0674 W/cmKPlutoniumPu940.0782 W/cmKManganeseMn250.0787 W/cmKBismuthBi830.0834 W/cmKMercuryHg800.1 W/cmKAmericiumAm950.1 W/cmKCaliforniumCf980.1 W/cmKNobeliumNo1020.1 W/cmKCuriumCm960.1 W/cmKLawrenciumLr1030.1 W/cmKFermiumFm1000.1 W/cmKEinsteiniumEs990.1 W/cmKBerkeliumBk970.1 W/cmKMendeleviumMd1010.106 W/cmKGadoliniumGd640.107 W/cmKDysprosiumDy660.111 W/cmKTerbiumTb650.114 W/cmKCeriumCe580.12 W/cmKActiniumAc890.125 W/cmKPraseodymiumPr590.133 W/cmKSamariumSm620.135 W/cmKLanthanumLa570.139 W/cmKEuropiumEu630.143 W/cmKErbiumEr680.15 W/cmKFranciumFr870.158 W/cmKScandiumSc210.162 W/cmKHolmiumHo670.164 W/cmKLutetiumLu710.165 W/cmKNeodymiumNd600.168 W/cmKThuliumTm690.172 W/cmKYttriumY390.179 W/cmKPromethiumPm610.184 W/cmKBariumBa560.186 W/cmKRadiumRa880.2 W/cmKPoloniumPo840.219 W/cmKTitaniumTi220.227 W/cmKZirconiumZr400.23 W/cmKHafniumHf720.23 W/cmKRutherfordiumRf1040.243 W/cmKAntimonySb510.274 W/cmKBoronB50.276 W/cmKUraniumU920.307 W/cmKVanadiumV230.349 W/cmKYtterbiumYb700.353 W/cmKStrontiumSr380.353 W/cmKLeadPb820.359 W/cmKCesiumCs550.406 W/cmKGalliumGa310.461 W/cmKThalliumTl810.47 W/cmKProtactiniumPa910.479 W/cmKRheniumRe750.502 W/cmKArsenicAs330.506 W/cmKTechnetiumTc430.537 W/cmKNiobiumNb410.54 W/cmKThoriumTh900.575 W/cmKTantalumTa730.58 W/cmKDubniumDb1050.582 W/cmKRubidiumRb370.599 W/cmKGermaniumGe320.666 W/cmKTinSn500.716 W/cmKPlatinumPt780.718 W/cmKPalladiumPd460.802 W/cmKIronFe260.816 W/cmKIndiumIn490.847 W/cmKLithiumLi30.876 W/cmKOsmiumOs760.907 W/cmKNickelNi280.937 W/cmKChromiumCr240.968 W/cmKCadmiumCd481 W/cmKCobaltCo271.024 W/cmKPotassiumK191.16 W/cmKZincZn301.17 W/cmKRutheniumRu441.29 W/cmKCarbonC61.38 W/cmKMolybdenumMo421.41 W/cmKSodiumNa111.47 W/cmKIridiumIr771.48 W/cmKSiliconSi141.5 W/cmKRhodiumRh451.56 W/cmKMagnesiumMg121.74 W/cmKTungstenW742.01 W/cmKCalciumCa202.01 W/cmKBerylliumBe42.37 W/cmKAluminumAl133.17 W/cmKGoldAu794.01 W/cmKCopperCu294.29 W/cmKSilverAg47"""

    # --- 1. Processar a string bruta para extrair dados ---
    extracted_data = {}
    
    # Regex explicaçao:
    # ([\d\.]+)    -> Captura o valor numérico (ex: 0.0000364)
    # \sW/cmK      -> Captura a unidade literal e o espaço
    # ([A-Za-z]+)  -> Captura o Nome+Simbolo (ex: RadonRn) até encontrar o número atômico
    pattern = re.compile(r"([\d\.]+)\sW/cmK([A-Za-z]+)")
    
    matches = pattern.findall(raw_data)
    
    print(f"Dados encontrados na string: {len(matches)} elementos.")

    for val_str, name_symbol_str in matches:
        try:
            # Converter W/cmK para W/mK (x100)
            # 1 W/cmK = 100 W/mK
            val_mk = float(val_str) * 100
            
            # Extrair o Símbolo do "NameSymbol" (ex: "RadonRn" -> "Rn")
            # Lógica: O símbolo começa na última letra Maiúscula da string
            upper_indices = [i for i, char in enumerate(name_symbol_str) if char.isupper()]
            if not upper_indices:
                continue
                
            last_upper_idx = upper_indices[-1]
            symbol = name_symbol_str[last_upper_idx:] # Pega do último maiúsculo até o fim
            
            extracted_data[symbol] = val_mk
            
        except ValueError:
            print(f"Erro ao processar valor: {val_str}")
            continue

    # --- 2. Ler o arquivo TS existente ---
    if not os.path.exists(filename):
        print(f"Erro: {filename} não encontrado.")
        return

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrair o JSON de dentro da estrutura TS "export const ... = { ... }"
    # Encontra a primeira { e a última }
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    
    if start_idx == -1 or end_idx == -1:
        print("Erro: Estrutura JSON não encontrada no arquivo .ts")
        return

    json_str = content[start_idx:end_idx]
    
    # Limpeza extra para garantir que é JSON válido (remove trailing commas se houver)
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)

    try:
        scientific_data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Erro ao decodificar JSON do arquivo: {e}")
        return

    # --- 3. Atualizar os dados ---
    updated_count = 0
    zeroed_count = 0

    for element, props in scientific_data.items():
        if element in extracted_data:
            props['thermalConductivity'] = extracted_data[element]
            updated_count += 1
        else:
            # Se não estiver na lista nova, zera
            props['thermalConductivity'] = 0
            zeroed_count += 1

    # --- 4. Salvar de volta no formato TS ---
    # Gerar JSON formatado
    new_json_str = json.dumps(scientific_data, indent=2, ensure_ascii=False)
    
    # Remontar o arquivo TS
    # Pega o que tinha antes do JSON (header) e depois (footer/ponto e vírgula)
    # Geralmente é "export const SCIENTIFIC_DATA = " e " as const;"
    header = content[:start_idx]
    
    # Verifica se tem o "as const;" no final original, se não, adiciona simples ;
    footer = content[end_idx:]
    if not footer.strip():
        footer = ";" 

    final_content = f"{header}{new_json_str}{footer}"

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print("-" * 30)
    print(f"Sucesso!")
    print(f"Elementos atualizados com novos valores: {updated_count}")
    print(f"Elementos definidos como 0 (não encontrados): {zeroed_count}")
    print(f"Arquivo salvo: {filename}")

if __name__ == "__main__":
    update_thermal_conductivity()