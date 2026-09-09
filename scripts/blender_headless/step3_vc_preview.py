import bpy
import math
import mathutils
import os

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"
OUT_DIR = r"D:\Projects\sayfer-bio\artifacts\blender"

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
scene = bpy.context.scene
lp = bpy.data.objects["Scaffold_LP"]

mat = bpy.data.materials.new("Scaffold_VC_Preview")
mat.use_nodes = True
nt = mat.node_tree
nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputMaterial")
out.location = (400, 0)
bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
bsdf.location = (100, 0)
bsdf.inputs["Roughness"].default_value = 0.88
bsdf.inputs["Metallic"].default_value = 0.0
nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
vc_node = nt.nodes.new("ShaderNodeVertexColor")
vc_node.layer_name = "final_vc"
vc_node.location = (-200, 0)
nt.links.new(vc_node.outputs["Color"], bsdf.inputs["Base Color"])

lp.data.materials.clear()
lp.data.materials.append(mat)

for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA"):
        bpy.data.objects.remove(o, do_unlink=True)


def add_sun(name, direction_deg, energy, color):
    light_data = bpy.data.lights.new(name, type="SUN")
    light_data.energy = energy
    light_data.color = color
    light_data.angle = math.radians(2.0)
    obj = bpy.data.objects.new(name, light_data)
    obj.rotation_euler = (math.radians(direction_deg[0]), math.radians(direction_deg[1]), math.radians(direction_deg[2]))
    scene.collection.objects.link(obj)
    return obj


add_sun("Key", (60, 0, -50), 2.4, (1.0, 0.94, 0.84))
add_sun("Rake2", (110, 0, 130), 1.0, (1.0, 0.91, 0.80))
add_sun("Rim", (30, 0, 170), 1.6, (1.0, 0.87, 0.67))
add_sun("Fill", (-70, 0, 20), 0.4, (0.78, 0.80, 0.84))

world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.02, 0.022, 0.02, 1.0)
    bg.inputs["Strength"].default_value = 0.15

bbox = [lp.matrix_world @ mathutils.Vector(c) for c in lp.bound_box]
center = sum(bbox, mathutils.Vector()) / 8
dims = lp.dimensions
diag = dims.length

cam_data = bpy.data.cameras.new("PreviewCam")
cam_data.lens = 50
cam_data.clip_start = 0.0005
cam_obj = bpy.data.objects.new("PreviewCam", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj


def frame_camera(cam_obj, target, distance, elev_deg, azim_deg):
    az = math.radians(azim_deg)
    el = math.radians(elev_deg)
    offset = mathutils.Vector((
        distance * math.cos(el) * math.sin(az),
        -distance * math.cos(el) * math.cos(az),
        distance * math.sin(el),
    ))
    cam_obj.location = target + offset
    direction = target - cam_obj.location
    cam_obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


scene.render.engine = "CYCLES"
scene.cycles.device = "CPU"
scene.cycles.samples = 96
scene.render.resolution_x = 1400
scene.render.resolution_y = 1400
scene.render.image_settings.file_format = "PNG"

frame_camera(cam_obj, center, diag * 0.9, 8, 25)
scene.render.filepath = os.path.join(OUT_DIR, "scaffold-v2-vcbake-preview-hero.png")
bpy.ops.render.render(write_still=True)
print("rendered hero preview")

lp_local_bbox_min = mathutils.Vector((min(v[0] for v in lp.bound_box), min(v[1] for v in lp.bound_box), min(v[2] for v in lp.bound_box)))
lp_local_bbox_max = mathutils.Vector((max(v[0] for v in lp.bound_box), max(v[1] for v in lp.bound_box), max(v[2] for v in lp.bound_box)))
mid_local = (lp_local_bbox_min + lp_local_bbox_max) / 2
mid_world = lp.matrix_world @ mid_local
frame_camera(cam_obj, mid_world, diag * 0.24, 10, -35)
scene.render.filepath = os.path.join(OUT_DIR, "scaffold-v2-vcbake-preview-close.png")
bpy.ops.render.render(write_still=True)
print("rendered close preview")
print("DONE_STEP3_VC")
