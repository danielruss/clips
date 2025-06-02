import mocha from 'https://cdn.jsdelivr.net/npm/mocha@10.7.3/+esm'
import { assert } from 'https://cdn.jsdelivr.net/npm/chai@5.1.1/+esm'
import { configureClips,runClipsPipeline } from "https://cdn.jsdelivr.net/npm/@danielruss/clips@latest/+esm";

function checkCodes(res,exp){
    assert.isArray(res,"the results should have a naics2022 array");
    assert.lengthOf(res,exp.length,`there should be ${exp.length} naics2022 codes`);
    assert.deepEqual(res,exp,'codes dont match the python results')
}
function checkScores(res,exp){
    console.log("-----------------------------------------------------------",exp,res)
    assert.isArray(res,"the results should have a score array");
    assert.lengthOf(res,exp.length,`there should be ${exp.length} scores`);
    for (let i=0;i<exp.length;i++){
        console.log(`${i}: res: ${res[i]} expect: ${exp[i]} len: ${exp.length}`)
        assert.closeTo(res[0],exp[0],0.0001,`Score ${i} is not within 1e-4 of the expected result.`)
    }
}

mocha.setup('bdd');
describe('CLIPS Test', () => {
    it('should code without a sic1987 code and match the python result', async function(){
        this.slow(2000)
        // version 0.0.2 is the default, but let's be verbose.
        let config = await configureClips("0.0.2")   
        let data = [
            {id:"test-001",products_services:"made oils"},
            {id:"test-002",products_services:"watch repair"}
        ];
        let res = await runClipsPipeline(data,config,{n:2})
        console.log("check test-001 ......")
        checkCodes(res[0].naics2022,['31122','32599'])
        checkScores(res[0].score,[0.8217,0.1663])
        console.log("check test-002......")
        checkCodes(res[1].naics2022,['81121','81149'])
        checkScores(res[1].score,[0.8032,0.772])
    })

    it('should code with a sic1987 code and match the python result', async function(){
        this.slow(10000)
        // version 0.0.2 is the default, but let's be verbose.
        let config = await configureClips("0.0.2")   
        let data = [
            {id:"test-001",products_services:"made oils",sic1987:"9999"},
            {id:"test-002",products_services:"watch repair",sic1987:"7631"}
        ];
        let res = await runClipsPipeline(data,config,{n:2})
        checkCodes(res[0].naics2022,['31122','32599'])
        checkScores(res[0].score,[0.8217,0.1663])     
        checkCodes(res[1].naics2022,['81149','81121'])
        checkScores(res[1].score,[0.8568,0.6696])

    })
})

mocha.run();