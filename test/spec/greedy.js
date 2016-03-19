var expect = require('chai').expect
  , fs = require('fs')
  , mkast = require('mkast')
  , Node = mkast.Node
  , parser = new mkast.Parser()
  , mkabs = require('../../index')
  , Absolute = require('../../absolute')
  , utils = require('../util')
  , collect = mkast.walker.collect;

describe('mkabs:', function() {

  it('should make relative links absolute (greedy)', function(done) {
    var source = 'test/fixtures/abs.md'
      , target = 'target/abs.json.log'
      , data = parser.parse('' + fs.readFileSync(source))

    // mock file for correct relative path
    // mkcat normally injects this info
    data._file = source;

    var input = mkast.serialize(data)
      , output = fs.createWriteStream(target)
      , opts = {
          input: input,
          output: output,
          base: 'http://base.com',
          greedy: true
        };
    
    mkabs(opts);

    output.once('finish', function() {
      var result = utils.result(target);

      // open document
      expect(result[0]._type).to.eql(Node.DOCUMENT);
      // mock document paragraph
      expect(result[1]._type).to.eql(Node.PARAGRAPH);

      var links = collect(result, Node.LINK)
        , slash = links[0]
        , anchor = links[1]
        , absolute = links[2]
        , query = links[3];

      expect(slash._destination).to.eql('http://base.com/README.md');
      expect(anchor._destination).to.eql('http://base.com#api');
      expect(absolute._destination).to.eql('http://example.com');
      expect(query._destination).to.eql('http://base.com?foo=val');

      // eof main document
      expect(result[2]._type).to.eql(Node.EOF);

      done();
    })
  });

});
