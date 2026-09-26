const prisma = require("../databases/prisma");
const AlunoInvalidoError = require("../errors/AlunoInvalidoError");
const AlunoNaoEncontradoError = require("../errors/AlunoNaoEncontradoError");
const EmailDuplicadoError = require("../errors/EmailDuplicadoError");
const alunoSchema = require("../schemas/alunoSchema");

const atualizacaoAlunoSchema = alunoSchema.partial();

class AlunoService{

    validarInteiro(valor, campo){
        if(!["string", "number"].includes(typeof valor) || !/^\d+$/.test(String(valor))){
            throw new AlunoInvalidoError(`${campo} deve ser um inteiro positivo.`);
        }
        const numero = Number(valor);
        if(!Number.isSafeInteger(numero) || numero < 1 || numero > 2147483647){
            throw new AlunoInvalidoError(`${campo} deve ser um inteiro positivo válido.`);
        }
        return numero;
    }

    async findMany(page = 1, pageSize = 10, orderBy = "id", order = "asc"){
        page = this.validarInteiro(page, "page");
        pageSize = this.validarInteiro(pageSize, "pageSize");
        const skip = (page - 1) * pageSize;
        if(!Number.isSafeInteger(skip) || skip > 2147483647){
            throw new AlunoInvalidoError("A paginação excede o limite permitido.");
        }
        if(!["id", "nome", "email", "createdAt", "updatedAt"].includes(orderBy)){
            throw new AlunoInvalidoError("Campo de ordenação inválido.");
        }
        if(!["asc", "desc"].includes(order)){
            throw new AlunoInvalidoError('A ordenação deve ser "asc" ou "desc".');
        }
        const [alunos, total] = await Promise.all([
            prisma.aluno.findMany({
                skip,
                take: pageSize,
                orderBy: orderBy === "id" ? {id: order} : [{[orderBy]: order}, {id: "asc"}]
            }),
            prisma.aluno.count()
        ]);
        return {alunos, total};
    }

    async findUnique(id){
        id = this.validarInteiro(id, "id");
        const aluno = await prisma.aluno.findUnique({where: {id}});
        if(!aluno){
            throw new AlunoNaoEncontradoError();
        }
        return aluno;
    }

    async update(id, dados){
        id = this.validarInteiro(id, "id");
        const resultado = atualizacaoAlunoSchema.safeParse(dados);
        if(!resultado.success){
            throw new AlunoInvalidoError("Dados inválidos: informe nome e/ou email válidos.");
        }
        if(Object.keys(resultado.data).length === 0){
            throw new AlunoInvalidoError("Informe nome e/ou email para atualizar o aluno.");
        }
        try{
            return await prisma.aluno.update({where: {id}, data: resultado.data});
        }catch(error){
            if(error.code === "P2025"){
                throw new AlunoNaoEncontradoError();
            }
            if(error.code === "P2002"){
                throw new EmailDuplicadoError();
            }
            throw error;
        }
    }

    async create(aluno){
        const {nome, email} = aluno;
        if(!nome || !email){
            throw new AlunoInvalidoError();
        }

        const novoAluno = await prisma.aluno.create({data: aluno});

        return novoAluno;
    }
}

module.exports = new AlunoService();
