(function (GGRC, Generator) {
  GGRC.Bootstrap.Mockups = GGRC.Bootstrap.Mockups || {};
  GGRC.Bootstrap.Mockups.Request = GGRC.Bootstrap.Mockups.Request || {};

  GGRC.Bootstrap.Mockups.Request.Info = {
    title: "Info",
    icon: "grcicon-info",
    template: "/request/info.mustache",
    info_title: "My new audit",
    description: Generator.paragraph(7),
    state: "In Progress",
    type_lead: "lead",
    type_auditor: "auditor",
    people_assignee: Generator.get("user", 5),
    people_requester: Generator.get("user"),
    people_verifier: Generator.get("user", 3),
    state_color: "inprogress",
    comments: can.Map(Generator.get("comment", 10, {sort: "date"})),
    logs: Generator.create({
      author: "%user",
      timestamp: "%date",
      data: [{
        status: "made changes",
        field: "Comment",
        original: {
          text: "%text"
        },
        changed: {
          text: "%text"
        }
      }, {
        status: "made changes",
        field: "Evidence",
        original: {
          files: []
        },
        changed: {
          files: "%files"
        }
      }, {
        status: "made changes",
        field: "People - Requester",
        original: {
          author: "%user"
        },
        changed: {
          author: "%user"
        }
      }, {
        status: "created request",
        field: ""
      }, {
        status: "made changes",
        field: "Dates - Due on",
        original: {
          text: "%date"
        },
        changed: {
          text: "%date"
        }
      }, {
        status: "made changes",
        field: "Dates - Created on",
        original: {
          text: "%date"
        },
        changed: {
          text: "%date"
        }
      }, {
        status: "made changes",
        field: "Description",
        original: {
          text: "%text"
        },
        changed: {
          text: "%text"
        }
      }]
    }, {
      count: 5,
      randomize: "data"
    }),
    mapped_objects: [{
      icon: "objective",
      title: "090.7068 objective 1",
      state: "Draft",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer bibendum sem id lectus porta, eu rutrum nunc commodo."
    }, {
      icon: "control",
      title: "Access to the Private Network with expired Key v0906984",
      state: "In Progress",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer bibendum sem id lectus porta, eu rutrum nunc commodo."
    }, {
      icon: "regulation",
      title: "a regulation object",
      state: "In Progress",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer bibendum sem id lectus porta, eu rutrum nunc commodo."
    }],
    past_requests: Generator.get("request", 5)
  };
})(GGRC || {}, GGRC.Mockup.Generator);