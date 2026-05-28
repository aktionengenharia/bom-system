import pandas as pd
import os
import openpyxl
#import numpy as np

# * * DECLAR NOME DE TABELAS * *
TABELA_AUXILIAR = "Tabela_Mae.xlsm"
LISTA_DE_MATERIAIS = "ATM_ENG_Planilha_LM_R00.xlsm"
TABELA_MAE = "TABELA MÃE"

# * * DECLAR NOME DE COLUNAS * *
COL_FAMILIA = "FAMÍLIA"
COL_SUBFAMILIA = "SUB-FAMÍLIA"
COL_SINAPI = "CODIGO SINAPI"
COL_DESCRICAO = "DESCRIÇÃO"
COL_FABRICANTE = "FABRICANTE DE REFERÊNCIA"
COL_UNIDADE = "UN."
COL_PRECO = "PREÇO MÉDIO R$"
COL_DATA = "DATA DE ATUALIZAÇÃO"
COL_FONTE = "FONTE DO PREÇO MÉDIO"


#                           * * * * LER LISTA DE MATERIAIS E TABELA AUXILIAR * * * *

def lerListas():
    global listaDeMateriais, tabelaAuxiliar
    listaDeMateriais = pd.read_excel(LISTA_DE_MATERIAIS, sheet_name=TABELA_MAE, header=0)

    # 1. Cria tabela caso ela não exista
    if not os.path.exists(TABELA_AUXILIAR):
        tabelaAuxiliar = pd.DataFrame(columns=[COL_FAMILIA, COL_SUBFAMILIA, COL_SINAPI, COL_DESCRICAO, 
                                               COL_FABRICANTE, COL_UNIDADE, COL_PRECO, COL_DATA, COL_FONTE])
        tabelaAuxiliar.to_excel(TABELA_AUXILIAR, index=False, engine='openpyxl')

        tabelaAuxiliar = pd.read_excel(TABELA_AUXILIAR, engine='openpyxl')
        
    # 2. Caso contrário, lê a tabela normalmente
    else:
        tabelaAuxiliar = pd.read_excel(TABELA_AUXILIAR, engine='openpyxl')


#                           * * * * PREENCHER TABELA AUXILIAR WITH ITENS DE "TABELA MÃE" * * * *

def PreencherTabelaAuxiliar():
    global tabelaAuxiliar
    # 1. Achatar o MultiIndex das colunas para compatibilidade (Foi a IA que fez essa gambiarra, não me julguem 🤡)
    listaDeMateriais.columns = listaDeMateriais.columns.map(lambda x: ' '.join(str(y) for y in x) if isinstance(x, tuple) else str(x))

    # 2. Criar uma lista nova com as tabelas para concatenar
    tabelasLista = [listaDeMateriais, tabelaAuxiliar]

    # 3. Concatena as tabelas, preenchendo os valores da tabela auxiliar abaixo dos valores da tabela mãe, e salva a nova tabela auxiliar
    tabelaAuxiliar = pd.concat(tabelasLista, axis=0, ignore_index=True)
    tabelaAuxiliar.to_excel(TABELA_AUXILIAR, index=False)

#       ---------------------------------------------------------------------------------
#           Agora, todas as operações poderão ser feitas em cima da Tabela Auxiliar, 
#                        sem afetar a estrutura da Lista Original.
#       ---------------------------------------------------------------------------------
#
#
#
#                           * * * * PESQUISA DE ITENS SALVOS EM TABELA AUXILIAR * * * *

def pesquisarItem():
    global resultados, item_procurado
    # 1. Solicitar nome de item para pesquisa
    item_procurado = input("Pesquisar por item... ").lower()

    #  --------------------------------------------------------------------------------------------------------
    #   Notas da autora: Em uma implementação futura, com interface gráfica, a entrada de informações
    #                    do item pesquisado não se limitaria a apenas a descrição do item, mas seria
    #                    pela existência de 9 boxes (igual como no Streamlit) onde seriam consultados
    #                    apenas os itens que possuem os boxes preenchidos. 
    #
    #                    A pesquisa se aproximaria muito de uma lógica booleana, como:encontrar item
    #                    que tenha 'CABO' em 'DESCRIÇÃO' E 'CA BT' em 'FAMÍLIA'.
    #  ---------------------------------------------------------------------------------------------------------

    # 2. Buscar linhas que obtenham o nome correspondido
    # 2.2 Aplica uma função lambda para verificar se o item procurado está presente em qualquer coluna da linha, ignorando maiúsculas e minúsculas
    mask = tabelaAuxiliar.apply(lambda row: row.astype(str).str.lower().str.contains(item_procurado).any(), axis=1)
    resultados = tabelaAuxiliar[mask]

    # 3. Apresenta resultados compatíveis
    # 3.1 Se a pesquisa não estiver vazia, os itens compatíveis serão impressos
    if not resultados.empty:
        print(f"Encontrados {len(resultados)} itens contendo '{item_procurado}':")
        print(resultados)

    # 3.2 Caso contrário, ele avisa que nenhum item foi encontrado
    else:
        print(f"Nenhum item encontrado contendo '{item_procurado}'.")

    # 3.3 Dado o resultado, pergunta se quer pesquisar novamente ou encerrar o programa
    print("\nDigite 'sair' para encerrar ou pressione Enter para nova pesquisa.")
    resposta = input().lower()
    if resposta == 'sair':
        exit()
    # 3.4 Continua execução, mas script termina
    else:
        pass  

#       ---------------------------------------------------------------------------------
#           Agora, com um mecanismo de pesquisa implementado, as funções de edição,  
#                        remoção e verificação podem ser feitas.
#       ---------------------------------------------------------------------------------
#
#
#
# 
#                           * * * * SELECIONAR LINHA CORRESPONDENTE A ITEM PESQUISADO * * * *
def selecionarItem():
    global indice_item, item_selecionado
    # 1. Realizar a Pesquisa e apresentar resultados (já implementado no código acima);

    # Chamando função declarada em cima para realizar a pesquisa e apresentar resultados. No caso, chamaria de:
    pesquisarItem()  

    # 2. Solicitar ao usuário que escolha um item específico (por exemplo, pelo índice da linha);
    indice_item = int(input("\nDigite o índice do item que deseja editar ou remover:"))

    # 3. Validar escolha;
    if indice_item not in resultados.index:
        print("Índice inválido. Por favor, tente novamente.")
        exit()
    
    else:
        item_selecionado = resultados.loc[indice_item]
        print(f"Item selecionado: {item_selecionado}")

#  ---------------------------------------------------------------------------------------------------------
#   Notas da autora: Em uma implementação futura, com interface gráfica, o processo de seleção
#                    passaria a ser feita clicando no item escolhido, sem necessidade de digitar,
#                    e o a varíavel "indice_item" seria preenchida com o índice do item escolhido.
#                    Por enquanto, faço por índice porque não temos a interface ainda.
#  ---------------------------------------------------------------------------------------------------------

# 4. Oferecer opção de edição ou remoção.

def tomadaDecisao():
    print("\nDigite 'editar' para editar o item ou 'remover' para remover o item selecionado.")
    acao = input().lower()

    if acao == 'remover':
        # removerItem()
        pass
    elif acao == 'editar':
        # editarItem()
        pass
    else:   
        print("Opção inválida. Por favor, tente novamente.")
        exit()


#                           * * * * REMOVER LINHA CORRESPONDENTE A ITEM PESQUISADO * * * *
def removerItem():
    global tabelaAuxiliar
    # 1. Realizar a Pesquisa e apresentar resultados (já implementado no código acima);

    # Chamando função declarada em cima para realizar a pesquisa e apresentar resultados. No caso, chamaria de:
    selecionarItem()

    tabelaAuxiliar.drop(index=indice_item, inplace=True)
    tabelaAuxiliar.to_excel(TABELA_AUXILIAR, index=False)

#                           * * * * EDITAR LINHA CORRESPONDENTE A ITEM PESQUISADO * * * *
def editarLinha():
    # 1. Realizar a Pesquisa e apresentar resultados (já implementado no código acima);

    # Chamando função declarada em cima para realizar a pesquisa e apresentar resultados. No caso, chamaria de:
    selecionarItem()

    # 2. Solicitar ao usuário que escolha um item específico (por exemplo, pelo índice da linha);
    # (Já solicitado dentro do selecionarItem)

    # 3. Validar escolha;
    # (Já validado dentro do selecionarItem)

    # 4. Solicitar ao usuário que insira novos valores para cada coluna (ou mantener o valor atual);
    familia_nova = input("Digite a família do item: ")
    subfamilia_nova = input("Digite a sub-família do item: ")
    codigo_sinapi_novo = input("Digite o código SINAPI do item: ")
    descricao_nova = input("Digite a descrição do item: ")
    fabricante_novo = input("Digite o fabricante de referência do item: ")
    unidade_nova = input("Digite a unidade do item: ")
    preco_novo = input("Digite o preço médio do item: ")
    data_nova = input("Digite a data de atualização do preço médio do item: ")
    fonte_nova = input("Digite a fonte do preço médio do item: ")

    # 5. Cria uma nova linha com dados atualizados para tabela auxiliar
    item_editado = { 
        COL_FAMILIA: familia_nova,
        COL_SUBFAMILIA: subfamilia_nova,
        COL_SINAPI: codigo_sinapi_novo,
        COL_DESCRICAO: descricao_nova,
        COL_FABRICANTE: fabricante_novo,
        COL_UNIDADE: unidade_nova,
        COL_PRECO: preco_novo,
        COL_DATA: data_nova,
        COL_FONTE: fonte_nova
    }

    # 6. Substitui os valores da linha selecionada pelos novos valores na tabela auxiliar e salva alterações
    tabelaAuxiliar.loc[indice_item] = item_editado
    tabelaAuxiliar.to_excel(TABELA_AUXILIAR, index=False)

#                           * * * * PREENCHER NOVA LINHA EM TABELA AUXILIAR * * * *

def adicionarNovaLinha():
    global tabelaAuxiliar
    # 1. Solicitar ao usuário que insira valores para cada coluna da nova linha;

    familia_nova = input("Digite a família do item: ")
    subfamilia_nova = input("Digite a sub-família do item: ")
    codigo_sinapi_novo = input("Digite o código SINAPI do item: ")
    descricao_nova = input("Digite a descrição do item: ")
    fabricante_novo = input("Digite o fabricante de referência do item: ")
    unidade_nova = input("Digite a unidade do item: ")
    preco_novo = input("Digite o preço médio do item: ")
    data_nova = input("Digite a data de atualização do preço médio do item: ")
    fonte_nova = input("Digite a fonte do preço médio do item: ")

    # 2. Criar uma nova linha com os valores adicionados
    nova_linha = pd.DataFrame([{ 
        COL_FAMILIA: familia_nova,
        COL_SUBFAMILIA: subfamilia_nova,
        COL_SINAPI: codigo_sinapi_novo,
        COL_DESCRICAO: descricao_nova,
        COL_FABRICANTE: fabricante_novo,
        COL_UNIDADE: unidade_nova,
        COL_PRECO: preco_novo,
        COL_DATA: data_nova,
        COL_FONTE: fonte_nova
    }])

    # 3. Repassar valores para tabela auxiliar e salvar alterações
    tabelaAuxiliar = pd.concat([tabelaAuxiliar, nova_linha], ignore_index=True)
    tabelaAuxiliar.to_excel(TABELA_AUXILIAR, index=False)

    #                           * * * * VISUALIZAÇÃO DE TABELA AUXILIAR ANTES DE SUBIR PARA A TABELA AUXILIAR (CONFERIR) * * * *
    #                                                                   EM BREVE . . . 


    #                           * * * * SUBSTITUIR INFORMAÇÕES DA TABELA ORIGINAL PELAS INFORMAÇÕES DA TABELA AUXILIAR * * * *
    #                                                                   EM BREVE . . .
