var express = require('express');
var router = express.Router();

/**
 * 创建
 */
router.post('/admin/uploadGroup', function(req, res) {
    var name = req.body.name;
    var uploadGroup = req.models.upload_category;
    var CategoryGroup = req.models.category_group;
    var Response = req.Response;
    var groupId = req.body.groupId;
    if (!name) return res.send(new Response(-1, null, 'name is not valid'));
    uploadGroup.create({name: name}, function(err, c) {
        if (err) {
            console.log(err);
            return res.send(new Response(-2, null, JSON.stringify(err)));
        } else {
            if (groupId) {
                CategoryGroup.get(groupId, function(err, group) {
                    if (err) return new Response(-3, null, JSON.stringify(err));
                    else c.setGroup(group, function(err) {
                        if (err) return new Response(-4, null, JSON.stringify(err));
                        else return res.send(new Response());
                    });
                });
            } else return res.send(new Resposne());
        }
        return res.send(new Response());
    });
});

/**
 * 修改
 */
router.post('/admin/uploadGroup/:id', function(req, res) {
    var UploadGroup = req.models.upload_category;
    var CategoryGroup = req.models.category_group;
    var Response = req.Response;
    var reqData = req.body;
    if (!req.params.id) return res.send(new Response(-1, null, '参数id错误'));
    UploadGroup.get(req.params.id, function(err, ug) {
        if (err) {
            return res.send(new Response(-2, null, err));
        } else {
            if (reqData.hasOwnProperty('name')) {
                ug.name = reqData.name;
            }
            if (reqData.groupId) {
                CategoryGroup.get(reqData.groupId, function(err, group) {
                    if (err) {
                        return res.send(new Response(-3, null, err));
                    } else {
                        ug.setGroup(group, function(err) {
                            if (err) {
                                return res.send(new Response(-4, null, err));
                            } else {
                                return res.send(new Response());
                            }
                        });
                    }
                });
            }
        }
    });
});

router.get('/admin/uploadGroups', function(req, res) {
    var uploadGroup = req.models.upload_category;
    var Response = req.Response;
    uploadGroup.all(function(err, uploadGroups) {
        if (err) {
            return res.send(new Response(-1, null, err));
        } else {
            return res.send(new Response(0, uploadGroups));
        } 
    });
});

router.post('/admin/uploadGroup/:id/delete', function(req, res) {
    var uploadGroup = req.models.upload_category;
    var Response = req.Response;
    if (!req.params.id) return res.send(new Response(-1, null, '参数错误'));
    uploadGroup.get(req.params.id, function(err, ucg) {
        if (err) return res.send(new Response(-2, null, err));
        ucg.remove(function(err) {
            if (err) return res.send(new Response(-3, null, err));
            return res.send(new Response());
        });
    });
});


router.post('/admin/uploadGroup/:id/map/categoryGroup/:gid', function(req, res) {
    var uploadGroup = req.models.upload_category;
    var categoryGroup = req.models.category_group;
    var Response = req.Response;
    var id = req.params.id;
    var gid = req.params.gid;
    if (!id || !gid) return res.send(new Response(-1, null, '参数不合法'));
    uploadGroup.get(id, function(err, ug) {
        if (err) return res.send(new Response(-2, null, err));
        categoryGroup.get(gid, function(err, g) {
            if (err) res.send(new Response(-3, null, err));
            ug.setGroup(g, function(err) {
                if (err) return res.send(new Response(-4, null, err));
                return res.send(new Response());
            });
        });
    });
});

module.exports = router;