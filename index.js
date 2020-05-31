
const mongoose = require('mongoose');
function mongocon() {
    mongoose.set('useFindAndModify', false);
    mongoose.connect("mongodb://127.0.0.1:27017/test", {useNewUrlParser: true, useUnifiedTopology: true});
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, ' mongodb connection error:'));
    db.on('open',()=>{
        console.log(' mongodb connection success')
    })
    return mongoose;
}
const To_Dos = mongocon().model('To_Dos',{'title':String,'time':String,'detail':String},'to_dos');
//init data;
const default_To_Dos = [{
    title: 'have a rest',
    time:'10:30',
    detail: 'drink some water',
}, {
    title: 'relax',
    time:'11:30',
    detail: 'listen a song',
},{
    title:'have a rest',
    time:'12:30',
    detail:'take a nap',
}];
for (let index = 0; index < default_To_Dos.length; index++) {
    let element = default_To_Dos[index];
    create_new_To_Do(element);
}
async function get_all_To_Dos(){
    let result = await To_Dos.find({})
    return(result);
}
async function create_new_To_Do(to_do){
    let length = (await To_Dos.find(to_do)).length;
    //console.log(length);
    if (length>0){
        return([{'return':'create new item failed,the to_do item already exists.'}]);
    }else{
        let new_To_Do = new To_Dos(to_do);
        let reback = new_To_Do.save().then((result)=>{
            //console.log(Object.assign({'return':'create new to_do item success'},result._doc));
            return([Object.assign({'return':'create new to_do item success','id':result.id},result._doc)]);
        },()=>{
            //console.log('create new item failed');
            return([{'return':'create new to_do item failed'}]);
        });
        return(reback);
    }
}
async function update_To_Do(ori_to_do,new_to_do){
    let length = (await To_Dos.find(ori_to_do)).length;
    if (length<=0){
        return([{'return':'update failed,the to_do item dose not exist.'}])
    }else{
        let reback = To_Dos.findOneAndUpdate(ori_to_do,{$set:new_to_do}).then(async (result)=>{
            let after = await To_Dos.find({'_id':result.id})
            result._doc['id']=result._doc._id;
            after[0]._doc['id']=after[0]._doc._id
            //console.log({'return':"update success"},result._doc,after[0]._doc);
            return([{'return':"update success","before":[result._doc],"after":[after[0]._doc]}]);
        },() => {
            return([{'return':'update failed'}]);
        });
        return(reback);
    }
};
async function delete_To_Do(to_do){
    
    let length = (await To_Dos.find(to_do)).length;
    if(length>0){
        let reback = To_Dos.findOneAndDelete(to_do).then((result) => {
            //console.log('delete success',result.id);
            return([Object.assign({'return':"delete success",'id':result.id},result._doc)]);
        },() => {
            //console.log('delete failed');
            return([{'return':'delete failed'}]);
        });
        return(reback)
    }else{
        return([{'return':'delete failed,the to_do item dose not exist.'}])
    }
};
const { ApolloServer, gql } =require('apollo-server');
const typeDefs = gql`
# 模型
type To_Dos {
    #id
    id: String
    #标题
    title: String
    #时间
    time: String
    #详细内容
    detail: String
}
type Query {
    # 查询所有
    get_all_To_Dos: [To_Dos]
}
  
type Mutation {
    #新增
    create_new_To_Do(to_do:input_To_Do):[reback]
    #修改
    update_To_Do(ori_to_do:input_To_Do,new_to_do:input_To_Do):[update_reback]
    #删除
    delete_To_Do(to_do:input_To_Do):[reback]
}
#输入
input input_To_Do {
    #标题
    title: String
    #时间
    time: String
    #详细内容
    detail: String
}
type reback {
    #返回信息
    return: String
    #id
    id: String
    #标题
    title: String
    #时间
    time: String
    #详细内容
    detail: String
}
type update_reback {
    #返回信息
    return: String
    before: [To_Dos]
    after: [To_Dos]
}
`;

const resolvers = {
    Query: {
        get_all_To_Dos: () => get_all_To_Dos(),
    },
    Mutation: {
        create_new_To_Do:(parent,{ to_do }) => create_new_To_Do(to_do),
        update_To_Do:(parent,{ ori_to_do,new_to_do}) => update_To_Do(ori_to_do,new_to_do),
        delete_To_Do:(parent,{ to_do }) => delete_To_Do(to_do),
    }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});