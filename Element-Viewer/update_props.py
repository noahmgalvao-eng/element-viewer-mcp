import json
import re
import os

def update_scientific_data_with_references():
    ts_file = 'scientific_data.ts'

    # --- PLACEHOLDERS PARA SUAS STRINGS DE DADOS ---
    # Cole suas strings exatamente como você as forneceu nas variáveis abaixo
    # (Mantenha as aspas triplas para suportar múltiplas linhas)

    # 1. String de Condutividade Térmica (Angstrom Sciences)
    # Exemplo de formato esperado: "0.0000364 W/cmKRadonRn86..."
    raw_thermal_conductivity_data = """
    Thermal ConductivityNameSymbol#0.0000364 W/cmKRadonRn860.0000569 W/cmKXenonXe540.000089 W/cmKChlorineCl170.0000949 W/cmKKryptonKr360.0001772 W/cmKArgonAr180.0002598 W/cmKNitrogenN70.0002674 W/cmKOxygenO80.000279 W/cmKFluorineF90.000493 W/cmKNeonNe100.00122 W/cmKBromineBr350.00152 W/cmKHeliumHe20.001815 W/cmKHydrogenH10.00235 W/cmKPhosphorusP150.00269 W/cmKSulfurS160.00449 W/cmKIodineI530.017 W/cmKAstatineAt850.0204 W/cmKSeleniumSe340.0235 W/cmKTelluriumTe520.063 W/cmKNeptuniumNp930.0674 W/cmKPlutoniumPu940.0782 W/cmKManganeseMn250.0787 W/cmKBismuthBi830.0834 W/cmKMercuryHg800.1 W/cmKAmericiumAm950.1 W/cmKCaliforniumCf980.1 W/cmKNobeliumNo1020.1 W/cmKCuriumCm960.1 W/cmKLawrenciumLr1030.1 W/cmKFermiumFm1000.1 W/cmKEinsteiniumEs990.1 W/cmKBerkeliumBk970.1 W/cmKMendeleviumMd1010.106 W/cmKGadoliniumGd640.107 W/cmKDysprosiumDy660.111 W/cmKTerbiumTb650.114 W/cmKCeriumCe580.12 W/cmKActiniumAc890.125 W/cmKPraseodymiumPr590.133 W/cmKSamariumSm620.135 W/cmKLanthanumLa570.139 W/cmKEuropiumEu630.143 W/cmKErbiumEr680.15 W/cmKFranciumFr870.158 W/cmKScandiumSc210.162 W/cmKHolmiumHo670.164 W/cmKLutetiumLu710.165 W/cmKNeodymiumNd600.168 W/cmKThuliumTm690.172 W/cmKYttriumY390.179 W/cmKPromethiumPm610.184 W/cmKBariumBa560.186 W/cmKRadiumRa880.2 W/cmKPoloniumPo840.219 W/cmKTitaniumTi220.227 W/cmKZirconiumZr400.23 W/cmKHafniumHf720.23 W/cmKRutherfordiumRf1040.243 W/cmKAntimonySb510.274 W/cmKBoronB50.276 W/cmKUraniumU920.307 W/cmKVanadiumV230.349 W/cmKYtterbiumYb700.353 W/cmKStrontiumSr380.353 W/cmKLeadPb820.359 W/cmKCesiumCs550.406 W/cmKGalliumGa310.461 W/cmKThalliumTl810.47 W/cmKProtactiniumPa910.479 W/cmKRheniumRe750.502 W/cmKArsenicAs330.506 W/cmKTechnetiumTc430.537 W/cmKNiobiumNb410.54 W/cmKThoriumTh900.575 W/cmKTantalumTa730.58 W/cmKDubniumDb1050.582 W/cmKRubidiumRb370.599 W/cmKGermaniumGe320.666 W/cmKTinSn500.716 W/cmKPlatinumPt780.718 W/cmKPalladiumPd460.802 W/cmKIronFe260.816 W/cmKIndiumIn490.847 W/cmKLithiumLi30.876 W/cmKOsmiumOs760.907 W/cmKNickelNi280.937 W/cmKChromiumCr240.968 W/cmKCadmiumCd481 W/cmKCobaltCo271.024 W/cmKPotassiumK191.16 W/cmKZincZn301.17 W/cmKRutheniumRu441.29 W/cmKCarbonC61.38 W/cmKMolybdenumMo421.41 W/cmKSodiumNa111.47 W/cmKIridiumIr771.48 W/cmKSiliconSi141.5 W/cmKRhodiumRh451.56 W/cmKMagnesiumMg121.74 W/cmKTungstenW742.01 W/cmKCalciumCa202.01 W/cmKBerylliumBe42.37 W/cmKAluminumAl133.17 W/cmKGoldAu794.01 W/cmKCopperCu294.29 W/cmKSilverAg47
    """

    # 2. String de Calor de Fusão (kJ/mol)
    # Exemplo de formato esperado: "Hydrogen 0.558 kJ/mol ..."
    raw_fusion_data = """
    Thermal ConductivityNameSymbol#0.0000364 W/cmKRadonRn860.0000569 W/cmKXenonXe540.000089 W/cmKChlorineCl170.0000949 W/cmKKryptonKr360.0001772 W/cmKArgonAr180.0002598 W/cmKNitrogenN70.0002674 W/cmKOxygenO80.000279 W/cmKFluorineF90.000493 W/cmKNeonNe100.00122 W/cmKBromineBr350.00152 W/cmKHeliumHe20.001815 W/cmKHydrogenH10.00235 W/cmKPhosphorusP150.00269 W/cmKSulfurS160.00449 W/cmKIodineI530.017 W/cmKAstatineAt850.0204 W/cmKSeleniumSe340.0235 W/cmKTelluriumTe520.063 W/cmKNeptuniumNp930.0674 W/cmKPlutoniumPu940.0782 W/cmKManganeseMn250.0787 W/cmKBismuthBi830.0834 W/cmKMercuryHg800.1 W/cmKAmericiumAm950.1 W/cmKCaliforniumCf980.1 W/cmKNobeliumNo1020.1 W/cmKCuriumCm960.1 W/cmKLawrenciumLr1030.1 W/cmKFermiumFm1000.1 W/cmKEinsteiniumEs990.1 W/cmKBerkeliumBk970.1 W/cmKMendeleviumMd1010.106 W/cmKGadoliniumGd640.107 W/cmKDysprosiumDy660.111 W/cmKTerbiumTb650.114 W/cmKCeriumCe580.12 W/cmKActiniumAc890.125 W/cmKPraseodymiumPr590.133 W/cmKSamariumSm620.135 W/cmKLanthanumLa570.139 W/cmKEuropiumEu630.143 W/cmKErbiumEr680.15 W/cmKFranciumFr870.158 W/cmKScandiumSc210.162 W/cmKHolmiumHo670.164 W/cmKLutetiumLu710.165 W/cmKNeodymiumNd600.168 W/cmKThuliumTm690.172 W/cmKYttriumY390.179 W/cmKPromethiumPm610.184 W/cmKBariumBa560.186 W/cmKRadiumRa880.2 W/cmKPoloniumPo840.219 W/cmKTitaniumTi220.227 W/cmKZirconiumZr400.23 W/cmKHafniumHf720.23 W/cmKRutherfordiumRf1040.243 W/cmKAntimonySb510.274 W/cmKBoronB50.276 W/cmKUraniumU920.307 W/cmKVanadiumV230.349 W/cmKYtterbiumYb700.353 W/cmKStrontiumSr380.353 W/cmKLeadPb820.359 W/cmKCesiumCs550.406 W/cmKGalliumGa310.461 W/cmKThalliumTl810.47 W/cmKProtactiniumPa910.479 W/cmKRheniumRe750.502 W/cmKArsenicAs330.506 W/cmKTechnetiumTc430.537 W/cmKNiobiumNb410.54 W/cmKThoriumTh900.575 W/cmKTantalumTa730.58 W/cmKDubniumDb1050.582 W/cmKRubidiumRb370.599 W/cmKGermaniumGe320.666 W/cmKTinSn500.716 W/cmKPlatinumPt780.718 W/cmKPalladiumPd460.802 W/cmKIronFe260.816 W/cmKIndiumIn490.847 W/cmKLithiumLi30.876 W/cmKOsmiumOs760.907 W/cmKNickelNi280.937 W/cmKChromiumCr240.968 W/cmKCadmiumCd481 W/cmKCobaltCo271.024 W/cmKPotassiumK191.16 W/cmKZincZn301.17 W/cmKRutheniumRu441.29 W/cmKCarbonC61.38 W/cmKMolybdenumMo421.41 W/cmKSodiumNa111.47 W/cmKIridiumIr771.48 W/cmKSiliconSi141.5 W/cmKRhodiumRh451.56 W/cmKMagnesiumMg121.74 W/cmKTungstenW742.01 W/cmKCalciumCa202.01 W/cmKBerylliumBe42.37 W/cmKAluminumAl133.17 W/cmKGoldAu794.01 W/cmKCopperCu294.29 W/cmKSilverAg47
    """

    # 3. String de Calor de Vaporização (kJ/mol)
    # Exemplo de formato esperado: "Helium 0.083 kJ/mol ..."
    raw_vaporization_data = """
    Helium 0.083 kJ/mol Lead 178 kJ/mol Boron 507 kJ/mol

Hydrogen 0.452 kJ/mol Manganese 220 kJ/mol Thorium 530 kJ/mol

Neon 1.75 kJ/mol Indium 230 kJ/mol Technetium 550 kJ/mol

Nitrogen 2.79 kJ/mol Thulium 250 kJ/mol Iridium 560 kJ/mol

Fluorine 3.27 kJ/mol Silver 255 kJ/mol Zirconium 580 kJ/mol

Oxygen 3.41 kJ/mol Gallium 256 kJ/mol Ruthenium 580 kJ/mol

Argon 6.5 kJ/mol Holmium 265 kJ/mol Molybdenum 600 kJ/mol

Krypton 9.02 kJ/mol Dysprosium 280 kJ/mol Hafnium 630 kJ/mol

Sulfur 9.8 kJ/mol Neodymium 285 kJ/mol Osmium 630 kJ/mol

Chlorine 10.2 kJ/mol Erbium 285 kJ/mol Niobium 690 kJ/mol

Phosphorus 12.4 kJ/mol Tin 290 kJ/mol Rhenium 705 kJ/mol

Xenon 12.64 kJ/mol Promethium 290 kJ/mol Carbon 715 kJ/mol

Bromine 14.8 kJ/mol Aluminum 293 kJ/mol Tantalum 736 kJ/mol

Radon 17 kJ/mol Terbium 295 kJ/mol Tungsten 800 kJ/mol

Iodine 20.9 kJ/mol Beryllium 297 kJ/mol Americium N/A

Selenium 26 kJ/mol Copper 300 kJ/mol Curium N/A

Arsenic 32.4 kJ/mol Gadolinium 305 kJ/mol Berkelium N/A

Astatine 40 kJ/mol Scandium 318 kJ/mol Californium N/A

Tellurium 48 kJ/mol Plutonium 325 kJ/mol Einsteinium N/A

Mercury 59.2 kJ/mol Praseodymium 330 kJ/mol Fermium N/A

Cesium 64 kJ/mol Gold 330 kJ/mol Mendelevium N/A

Francium 64 kJ/mol Germanium 334 kJ/mol Nobelium N/A

Antimony 67 kJ/mol Neptunium 335 kJ/mol Lawrencium N/A

Rubidium 71 kJ/mol Chromium 339 kJ/mol Rutherfordium N/A

Potassium 76.9 kJ/mol Iron 347 kJ/mol Dubnium N/A

Sodium 97.7 kJ/mol Cerium 350 kJ/mol Seaborgium N/A

Cadmium 100 kJ/mol Silicon 359 kJ/mol Bohrium N/A

Polonium 100 kJ/mol Cobalt 375 kJ/mol Hassium N/A

Zinc 119 kJ/mol Nickel 378 kJ/mol Meitnerium N/A

Radium 125 kJ/mol Yttrium 380 kJ/mol Darmstadtium N/A

Magnesium 128 kJ/mol Palladium 380 kJ/mol Roentgenium N/A

Strontium 137 kJ/mol Lanthanum 400 kJ/mol Copernicium N/A

Barium 140 kJ/mol Actinium 400 kJ/mol Nihonium N/A

Lithium 147 kJ/mol Lutetium 415 kJ/mol Flerovium N/A

Calcium 155 kJ/mol Uranium 420 kJ/mol Moscovium N/A

Ytterbium 160 kJ/mol Titanium 425 kJ/mol Livermorium N/A

Bismuth 160 kJ/mol Vanadium 453 kJ/mol Tennessine N/A

Thallium 165 kJ/mol Protactinium 470 kJ/mol Oganesson N/A

Samarium 175 kJ/mol Platinum 490 kJ/mol

Europium 175 kJ/mol Rhodium 495 kJ/mol
    """

    # --- FUNÇÕES AUXILIARES DE PROCESSAMENTO ---

    def parse_thermal_conductivity(raw_text):
        """
        Extrai {Simbolo: valor_W_mK} da string do Angstrom.
        Converte W/cmK para W/mK (x100).
        """
        data = {}
        # Regex para capturar: Valor numérico, unidade fixa, e Nome+Símbolo misturados
        # Ex: 0.0000364 W/cmKRadonRn86
        pattern = re.compile(r"([\d\.]+)\sW/cmK([A-Za-z]+)")
        matches = pattern.findall(raw_text)
        
        for val_str, name_symbol_str in matches:
            try:
                # Converter W/cmK para W/mK
                val_mk = float(val_str) * 100
                
                # Extrair Símbolo (Assume que começa na última letra maiúscula)
                upper_indices = [i for i, char in enumerate(name_symbol_str) if char.isupper()]
                if not upper_indices: continue
                symbol = name_symbol_str[upper_indices[-1]:]
                
                data[symbol] = val_mk
            except ValueError:
                continue
        return data

    def parse_latent_heat(raw_text):
        """
        Extrai {Simbolo: valor_kJ_mol} das strings de fusão/vaporização.
        Lida com múltiplas colunas e formatação "Nome Valor Unit".
        """
        data = {}
        # Remove quebras de linha extras e normaliza espaços
        lines = raw_text.strip().split('\n')
        
        for line in lines:
            # Pula linhas vazias ou cabeçalhos óbvios
            if not line.strip() or "Calor de" in line:
                continue

            # Divide a linha em pedaços por tabulação ou múltiplos espaços
            # A estrutura parece ser: [Nome, Valor, Unit, Nome, Valor, Unit...]
            parts = re.split(r'\t|\s{2,}', line.strip())
            
            # As vezes a divisão falha e junta tudo num espaço só. Vamos tentar regex global na linha.
            # Captura: (Nome do Elemento) (Valor ou N/A) (kJ/mol opcional)
            # Ex: "Hydrogen 0.558 kJ/mol" ou "Plutonium N/A"
            # Precisamos iterar sobre a linha procurando padrões de "Elemento Valor"
            
            # Regex robusto para pegar pares (Nome Elemento, Valor) na mesma linha
            # Aceita nomes compostos? Geralmente elementos são uma palavra só aqui.
            # Valor pode ser float ou "N/A"
            matches = re.findall(r"([A-Z][a-z]+)\s+([\d\.]+|N/A)(?:\s+kJ/mol)?", line)
            
            for name, val_str in matches:
                # Precisamos converter NOME para SÍMBOLO.
                # Como não temos um mapa fácil aqui, vamos tentar cruzar com o JSON depois
                # Mas espera, a string tem "Nome". O JSON é indexado por "Símbolo".
                # Vou criar um mapa reverso Nome->Símbolo usando o próprio JSON alvo depois.
                if val_str == "N/A":
                    continue
                try:
                    data[name] = float(val_str)
                except ValueError:
                    continue
        return data

    # --- EXECUÇÃO PRINCIPAL ---

    if not os.path.exists(ts_file):
        print(f"Erro: {ts_file} não encontrado.")
        return

    # 1. Ler arquivo TypeScript
    with open(ts_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extrair JSON
    start_idx = content.find('{')
    end_idx = content.rfind('}') + 1
    json_str = content[start_idx:end_idx]
    
    # Limpeza de JSON para Python
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Erro fatal no JSON: {e}")
        return

    # 2. Criar Mapa Nome -> Símbolo (Necessário para o Calor Latente)
    # A maioria dos JSONs científicos tem uma prop "name", mas o seu exemplo
    # tem apenas "H": { mass: ... }. O nome completo não está no objeto do elemento.
    # SE O SEU JSON NÃO TIVER O NOME COMPLETO ("Hydrogen"), esse script vai precisar
    # de um dicionário auxiliar interno. Vou incluir um básico aqui para garantir.
    
    # Mapa básico Nome -> Símbolo (Elementos mais comuns e os da lista)
    # Se o seu JSON já tiver o campo "name", podemos usar ele. Vou assumir que não tem.
    name_to_symbol = {
        "Hydrogen": "H", "Helium": "He", "Lithium": "Li", "Beryllium": "Be", "Boron": "B", 
        "Carbon": "C", "Nitrogen": "N", "Oxygen": "O", "Fluorine": "F", "Neon": "Ne",
        "Sodium": "Na", "Magnesium": "Mg", "Aluminum": "Al", "Silicon": "Si", "Phosphorus": "P",
        "Sulfur": "S", "Chlorine": "Cl", "Argon": "Ar", "Potassium": "K", "Calcium": "Ca",
        "Scandium": "Sc", "Titanium": "Ti", "Vanadium": "V", "Chromium": "Cr", "Manganese": "Mn",
        "Iron": "Fe", "Cobalt": "Co", "Nickel": "Ni", "Copper": "Cu", "Zinc": "Zn",
        "Gallium": "Ga", "Germanium": "Ge", "Arsenic": "As", "Selenium": "Se", "Bromine": "Br",
        "Krypton": "Kr", "Rubidium": "Rb", "Strontium": "Sr", "Yttrium": "Y", "Zirconium": "Zr",
        "Niobium": "Nb", "Molybdenum": "Mo", "Technetium": "Tc", "Ruthenium": "Ru", "Rhodium": "Rh",
        "Palladium": "Pd", "Silver": "Ag", "Cadmium": "Cd", "Indium": "In", "Tin": "Sn",
        "Antimony": "Sb", "Tellurium": "Te", "Iodine": "I", "Xenon": "Xe", "Cesium": "Cs",
        "Barium": "Ba", "Lanthanum": "La", "Cerium": "Ce", "Praseodymium": "Pr", "Neodymium": "Nd",
        "Promethium": "Pm", "Samarium": "Sm", "Europium": "Eu", "Gadolinium": "Gd", "Terbium": "Tb",
        "Dysprosium": "Dy", "Holmium": "Ho", "Erbium": "Er", "Thulium": "Tm", "Ytterbium": "Yb",
        "Lutetium": "Lu", "Hafnium": "Hf", "Tantalum": "Ta", "Tungsten": "W", "Rhenium": "Re",
        "Osmium": "Os", "Iridium": "Ir", "Platinum": "Pt", "Gold": "Au", "Mercury": "Hg",
        "Thallium": "Tl", "Lead": "Pb", "Bismuth": "Bi", "Polonium": "Po", "Astatine": "At",
        "Radon": "Rn", "Francium": "Fr", "Radium": "Ra", "Actinium": "Ac", "Thorium": "Th",
        "Protactinium": "Pa", "Uranium": "U", "Neptunium": "Np", "Plutonium": "Pu", "Americium": "Am",
        "Curium": "Cm", "Berkelium": "Bk", "Californium": "Cf", "Einsteinium": "Es", "Fermium": "Fm",
        "Mendelevium": "Md", "Nobelium": "No", "Lawrencium": "Lr", "Rutherfordium": "Rf", "Dubnium": "Db",
        "Seaborgium": "Sg", "Bohrium": "Bh", "Hassium": "Hs", "Meitnerium": "Mt", "Darmstadtium": "Ds",
        "Roentgenium": "Rg", "Copernicium": "Cn", "Nihonium": "Nh", "Flerovium": "Fl", "Moscovium": "Mc",
        "Livermorium": "Lv", "Tennessine": "Ts", "Oganesson": "Og"
    }

    # 3. Processar as Strings de Entrada
    print("Processando dados de Condutividade Térmica (Ref _4)...")
    therm_map = parse_thermal_conductivity(raw_thermal_conductivity_data)
    
    print("Processando dados de Calor de Fusão (Ref _5)...")
    fus_map_names = parse_latent_heat(raw_fusion_data)
    
    print("Processando dados de Calor de Vaporização (Ref _5)...")
    vap_map_names = parse_latent_heat(raw_vaporization_data)

    # 4. Atualizar o Objeto de Dados
    updated_therm = 0
    updated_lat = 0

    for symbol, props in data.items():
        mass = props.get('mass', 0)
        
        # --- ATUALIZAR CONDUTIVIDADE TÉRMICA (Sufixo _4) ---
        # Se o símbolo estiver no mapa extraído
        if symbol in therm_map:
            val = therm_map[symbol]
            # Formatar para string com sufixo _4
            # Remove zeros à direita de decimais desnecessários
            s_val = f"{val:.5f}".rstrip('0').rstrip('.')
            props['thermalConductivity'] = f"{s_val}_4"
            updated_therm += 1
        else:
            # Se não tiver na lista, deixa como 0 (número) ou "0_4"? 
            # O prompt pediu "coloca o numero 5 apos cada uma dessas propriedades".
            # Vou assumir que se não tem dado, mantém o que está (ou 0).
            pass

        # --- ATUALIZAR CALOR LATENTE (Sufixo _5) ---
        # Precisamos achar o nome em inglês para buscar nos mapas
        # Inverter a busca no name_to_symbol é custoso, vamos tentar achar o nome pelo symbol
        # Melhor estratégia: iterar o name_to_symbol e ver se bate com o symbol atual
        
        element_name = None
        for name, sym in name_to_symbol.items():
            if sym == symbol:
                element_name = name
                break
        
        if element_name and mass > 0:
            # Recuperar valores em kJ/mol
            kj_fus = fus_map_names.get(element_name, None)
            kj_vap = vap_map_names.get(element_name, None)
            
            # Pegar o objeto latentHeat atual (ou criar novo)
            # Nota: Agora ele vai virar um objeto de strings, cuidado se o TS esperar numbers.
            # O prompt implica mudança de tipo.
            lh = props.get('latentHeat', {})
            if not isinstance(lh, dict): lh = {}
            
            # Fusão
            if kj_fus is not None:
                # Converter kJ/mol -> J/kg
                # (Valor * 1000 * 1000) / mass
                val_jkg = (kj_fus * 1_000_000) / mass
                s_val = f"{val_jkg:.2f}".rstrip('0').rstrip('.')
                lh['fusion'] = f"{s_val}_5"
            
            # Vaporização
            if kj_vap is not None:
                val_jkg = (kj_vap * 1_000_000) / mass
                s_val = f"{val_jkg:.2f}".rstrip('0').rstrip('.')
                lh['vaporization'] = f"{s_val}_5"
            
            if kj_fus is not None or kj_vap is not None:
                props['latentHeat'] = lh
                updated_lat += 1

    # 5. Salvar Arquivo
    new_json_str = json.dumps(data, indent=2, ensure_ascii=False)
    
    # Remontar TS
    header = content[:start_idx]
    footer = content[end_idx:]
    if not footer.strip(): footer = ";"
    
    final_content = f"{header}{new_json_str}{footer}"

    with open(ts_file, 'w', encoding='utf-8') as f:
        f.write(final_content)

    print("-" * 40)
    print(f"ATUALIZAÇÃO CONCLUÍDA")
    print(f"Condutividade Térmica (Ref _4): {updated_therm} elementos atualizados.")
    print(f"Calor Latente (Ref _5): {updated_lat} elementos atualizados.")
    print(f"Arquivo salvo: {ts_file}")
    print("-" * 40)

if __name__ == "__main__":
    update_scientific_data_with_references()