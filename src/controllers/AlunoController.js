const alunoService = require("../services/AlunoService");

class AlunoController{
    
    async findMany(request, response){
        try{
            const {page = 1, pageSize = 10, orderBy = "id", order = "asc"} = request.query;
            const resultado = await alunoService.findMany(page, pageSize, orderBy, order);
            return response.status(200).json(resultado);
        }catch(error){
            return response.status(error.statusCode || 500).json({error: error.message});
        }
    }

    async findUnique(request, response){
        try{
            const aluno = await alunoService.findUnique(request.params.id);
            return response.status(200).json({aluno});
        }catch(error){
            return response.status(error.statusCode || 500).json({error: error.message});
        }
    }

    async create(request, response){
        try{
            const aluno = await alunoService.create(request.body);
            return response.status(201).json({aluno});
        }catch(error){
            return response.status(400).json({error: error.message});
        }
    }

}

module.exports = new AlunoController();
