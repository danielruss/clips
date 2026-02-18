import { assert } from 'chai';
import {CodingSystem, Crosswalk } from '../dist/node/clips.js'

describe('Crosswalk tests', function() {
    it('should be able to load the sic1987 -> naics2022 crosswalk',async function (){
        let sic1987_naics2022 = await Crosswalk.loadCrosswalk("sic1987","naics2022")
        assert.ok(sic1987_naics2022)
        assert.equal(sic1987_naics2022.from,"sic1987")
        assert.equal(sic1987_naics2022.to,"naics2022")
        assert.equal(sic1987_naics2022.isCached(),true)
    })

    it('should be able to crosswalk codes',async function (){
        let sic1987_naics2022 = await Crosswalk.loadCrosswalk("sic1987","naics2022")
        let x = sic1987_naics2022.crosswalkCodes( ["0111","0112"] )
        assert.equal(x.length,2)
        assert.ok(x.includes("11114"),"does not contain 11114")
        assert.ok(x.includes("11116"),"does not contain 11116")
    })
});


describe('CodingSystem tests', function() { 
    it('should be able to load the naics2022 coding system',async function (){
        let naics2022 = await CodingSystem.loadCodingSystem('naics2022')
        assert.ok(naics2022);
        assert.ok(naics2022.codes)
        assert.equal(naics2022.codes.length,689,"naics2022 should have 689 5-digit codes")
    })

    it('should be able to load the multi-hot encode',async function (){
        let naics2022 = await CodingSystem.loadCodingSystem('naics2022')
        let buffer=naics2022.createBuffer(1);
        naics2022.multiHotEncode(buffer,[["11132","48831"]])
        assert.equal(buffer[9],1)
        assert.equal(buffer[407],1)
    })
})

