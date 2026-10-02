# Independent support for the Coates Way vehicle draft

Author: Andrew Fisher.

Andrew asked in the Codex chat: “Lets add extra agents”. Six parallel reviewers are assigned vehicle appearance, cameras/driver sequencing, phone controls, rendering performance, mechanical behaviour and release integration. The first pass uses exact Claude draft ba9fff7ec48d3d49d037f461c145b1abd6f2c957. Claude retains implementation ownership of the moving v8.09 source. Reviewers work against an isolated snapshot and may supply independently tested patch proposals in this review folder; they do not change or publish his draft. One reviewer owns browser/GPU work; other reviews use source and bounded CPU checks to avoid competing performance measurements. Findings and handover follow here.
