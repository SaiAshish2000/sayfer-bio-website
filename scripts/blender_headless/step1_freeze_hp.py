"""
Step 1: open the web (decimated, 172k) scaffold file, append the approved R3
high-poly source objects, evaluate the R3 modifier stack (Boolean pores ->
voxel remesh -> tear/dry_folds/micro_grain displace -> edge split) into a
frozen real mesh, drop the modifiers-heavy originals, and save a new working
file. This isolates the expensive Boolean+Remesh evaluation (~3.1-3.5M tris)
into one file so later bake iterations don't have to redo it.

Never touches the original R3 source blend or the approved web blend --
reads them, writes a new file only.
"""
import bpy
import os

R3_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2.blend"
WEB_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-web.blend"
OUT_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"

# 1. open the web file (already the --background arg, but be explicit/safe)
bpy.ops.wm.open_mainfile(filepath=WEB_PATH)

lp = bpy.data.objects["Scaffold_LP"]
print("LP polys:", len(lp.data.polygons))

# 2. append Scaffold_Body + Scaffold_Voids + Scaffold_Zein material from R3
with bpy.data.libraries.load(R3_PATH, link=False) as (data_from, data_to):
    data_to.objects = ["Scaffold_Body", "Scaffold_Voids"]
    data_to.materials = ["Scaffold_Zein"]

scene = bpy.context.scene
for obj in data_to.objects:
    if obj is not None:
        scene.collection.objects.link(obj)
        print("linked", obj.name)

body = bpy.data.objects["Scaffold_Body"]
voids = bpy.data.objects["Scaffold_Voids"]
zein = bpy.data.materials["Scaffold_Zein"]

# sanity: modifiers present
print("Body modifiers:", [m.name for m in body.modifiers])

# 3. evaluate the full modifier stack into a real mesh (this is the slow step)
deps = bpy.context.evaluated_depsgraph_get()
body_eval = body.evaluated_get(deps)
print("Evaluating mesh (Boolean + voxel remesh + displacements)... this can take a while.")
hp_mesh = bpy.data.meshes.new_from_object(body_eval)
hp_mesh.name = "Scaffold_HP_mesh"
print("HP evaluated polys:", len(hp_mesh.polygons), "verts:", len(hp_mesh.vertices))

hp_obj = bpy.data.objects.new("Scaffold_HP_bake", hp_mesh)
scene.collection.objects.link(hp_obj)
hp_obj.location = body.location.copy()
hp_obj.rotation_euler = body.rotation_euler.copy()
hp_obj.scale = body.scale.copy()
if len(hp_mesh.materials) == 0:
    hp_mesh.materials.append(zein)
else:
    hp_mesh.materials[0] = zein
hp_obj.hide_render = False
hp_obj.hide_set(False)

# 4. remove the heavy modifier-stack originals now that we have the frozen mesh
bpy.data.objects.remove(body, do_unlink=True)
bpy.data.objects.remove(voids, do_unlink=True)

# 5. purge orphans (old Scaffold_Body/Voids meshes etc.) to keep file size sane
for _ in range(3):
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

bpy.ops.wm.save_as_mainfile(filepath=OUT_PATH)
print("SAVED", OUT_PATH)
print("DONE_STEP1")
